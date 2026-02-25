import type { EventName, EventProperties } from './event-map';

export interface PluginContext {
  track<E extends EventName>(eventName: E, properties?: EventProperties<E>): void;
  getConfig(): FootprintConfigReadonly;
  onBeforeSend(
    callback: (events: import('./event').TrackEvent[]) => import('./event').TrackEvent[],
  ): void;
}

export interface FootprintPlugin {
  name: string;
  setup(context: PluginContext): void;
  destroy?(): void;
}

export interface FootprintConfigReadonly {
  readonly appId: string;
  readonly serverUrl: string;
  readonly debug: boolean;
}
