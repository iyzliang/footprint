import type { FootprintPlugin, PluginContext, FootprintConfigReadonly, TrackEvent } from './types';

export class PluginManager {
  private plugins: FootprintPlugin[] = [];
  private beforeSendCallbacks: ((events: TrackEvent[]) => TrackEvent[])[] = [];
  private context: PluginContext | null = null;

  createContext(
    trackFn: PluginContext['track'],
    config: FootprintConfigReadonly,
  ): PluginContext {
    this.context = {
      track: trackFn,
      getConfig: () => config,
      onBeforeSend: (callback) => {
        this.beforeSendCallbacks.push(callback);
      },
    };
    return this.context;
  }

  register(plugins: FootprintPlugin[]): void {
    if (!this.context) {
      throw new Error('PluginManager: context must be created before registering plugins');
    }

    for (const plugin of plugins) {
      this.plugins.push(plugin);
      plugin.setup(this.context);
    }
  }

  applyBeforeSend(events: TrackEvent[]): TrackEvent[] {
    let result = events;
    for (const callback of this.beforeSendCallbacks) {
      result = callback(result);
    }
    return result;
  }

  destroy(): void {
    for (const plugin of this.plugins) {
      plugin.destroy?.();
    }
    this.plugins = [];
    this.beforeSendCallbacks = [];
    this.context = null;
  }

  getPluginNames(): string[] {
    return this.plugins.map((p) => p.name);
  }
}
