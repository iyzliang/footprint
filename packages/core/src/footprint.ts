import type {
  FootprintConfig,
  FootprintConfigReadonly,
  TrackEvent,
  EventName,
  EventProperties,
} from './types';
import { Transport } from './transport';
import { EventQueue } from './event-queue';
import { PluginManager } from './plugin-manager';
import { SessionManager } from './utils/session';
import { getAnonymousId } from './utils/anonymous-id';
import { getPageInfo, getDeviceInfo } from './utils/collect-info';

export class Footprint {
  private config: Required<
    Pick<
      FootprintConfig,
      | 'appId'
      | 'serverUrl'
      | 'debug'
      | 'flushThreshold'
      | 'flushInterval'
      | 'maxRetries'
      | 'sessionTimeout'
    >
  >;
  private transport: Transport;
  private queue: EventQueue;
  private pluginManager: PluginManager;
  private sessionManager: SessionManager;
  private userId: string | undefined;
  private globalProps: Record<string, unknown> = {};
  private destroyed = false;

  private constructor(config: FootprintConfig) {
    this.config = {
      appId: config.appId,
      serverUrl: config.serverUrl,
      debug: config.debug ?? false,
      flushThreshold: config.flushThreshold ?? 10,
      flushInterval: config.flushInterval ?? 5000,
      maxRetries: config.maxRetries ?? 3,
      sessionTimeout: config.sessionTimeout ?? 30 * 60 * 1000,
    };

    this.transport = new Transport({
      serverUrl: this.config.serverUrl,
      appId: this.config.appId,
      maxRetries: this.config.maxRetries,
    });

    this.queue = new EventQueue({
      transport: this.transport,
      flushThreshold: this.config.flushThreshold,
      flushInterval: this.config.flushInterval,
    });

    this.sessionManager = new SessionManager(this.config.sessionTimeout);

    this.pluginManager = new PluginManager();
    const readonlyConfig: FootprintConfigReadonly = {
      appId: this.config.appId,
      serverUrl: this.config.serverUrl,
      debug: this.config.debug,
    };

    this.pluginManager.createContext(
      (eventName, properties) => this.track(eventName, properties),
      readonlyConfig,
    );

    if (config.plugins && config.plugins.length > 0) {
      this.pluginManager.register(config.plugins);
    }

    void this.transport.retryFailedEvents();

    this.log('Footprint initialized', this.config);
  }

  static init(config: FootprintConfig): Footprint {
    if (!config.appId) {
      throw new Error('Footprint: appId is required');
    }
    if (!config.serverUrl) {
      throw new Error('Footprint: serverUrl is required');
    }
    return new Footprint(config);
  }

  track<E extends EventName>(eventName: E, properties?: EventProperties<E>): void {
    if (this.destroyed) {
      console.warn('Footprint: cannot track after destroy');
      return;
    }

    const event: TrackEvent = {
      eventName: eventName as string,
      properties: { ...this.globalProps, ...(properties as Record<string, unknown>) },
      timestamp: Date.now(),
      sessionId: this.sessionManager.getSessionId(),
      userId: this.userId,
      anonymousId: getAnonymousId(),
      appId: this.config.appId,
      page: getPageInfo(),
      device: getDeviceInfo(),
    };

    this.queue.enqueue(event);
    this.log('Event tracked', event.eventName, event.properties);
  }

  identify(userId: string): void {
    this.userId = userId;
    this.log('User identified', userId);
  }

  setGlobalProps(props: Record<string, unknown>): void {
    this.globalProps = { ...this.globalProps, ...props };
    this.log('Global props updated', this.globalProps);
  }

  async flush(): Promise<void> {
    await this.queue.flush();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    this.pluginManager.destroy();
    this.queue.destroy();
    this.sessionManager.destroy();

    this.log('Footprint destroyed');
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.log('[Footprint]', ...args);
    }
  }
}
