import { describe, it, expect, vi } from 'vitest';
import { PluginManager } from '../src/plugin-manager';
import type { FootprintPlugin, TrackEvent } from '../src/types';

function createMockPlugin(name: string, overrides: Partial<FootprintPlugin> = {}): FootprintPlugin {
  return {
    name,
    setup: vi.fn(),
    destroy: vi.fn(),
    ...overrides,
  };
}

function createMockEvent(eventName = 'test'): TrackEvent {
  return {
    eventName,
    properties: {},
    timestamp: Date.now(),
    sessionId: 's1',
    anonymousId: 'a1',
    appId: 'app1',
    page: { url: '', title: '', referrer: '' },
    device: { ua: '', screen: '', language: '' },
  };
}

describe('PluginManager', () => {
  const mockTrack = vi.fn();
  const mockConfig = { appId: 'test', serverUrl: 'http://test', debug: false };

  it('should create context and register plugins', () => {
    const manager = new PluginManager();
    manager.createContext(mockTrack, mockConfig);

    const plugin = createMockPlugin('test-plugin');
    manager.register([plugin]);

    expect(plugin.setup).toHaveBeenCalledOnce();
    expect(manager.getPluginNames()).toEqual(['test-plugin']);
    manager.destroy();
  });

  it('should call setup with correct context', () => {
    const manager = new PluginManager();
    const ctx = manager.createContext(mockTrack, mockConfig);

    const plugin = createMockPlugin('ctx-plugin');
    manager.register([plugin]);

    expect(plugin.setup).toHaveBeenCalledWith(ctx);
    manager.destroy();
  });

  it('should register multiple plugins in order', () => {
    const manager = new PluginManager();
    manager.createContext(mockTrack, mockConfig);

    const order: string[] = [];
    const p1 = createMockPlugin('p1', { setup: () => order.push('p1') });
    const p2 = createMockPlugin('p2', { setup: () => order.push('p2') });
    const p3 = createMockPlugin('p3', { setup: () => order.push('p3') });

    manager.register([p1, p2, p3]);
    expect(order).toEqual(['p1', 'p2', 'p3']);
    manager.destroy();
  });

  it('should throw if registering without context', () => {
    const manager = new PluginManager();
    const plugin = createMockPlugin('fail-plugin');

    expect(() => manager.register([plugin])).toThrow('context must be created');
    manager.destroy();
  });

  it('should call destroy on all plugins', () => {
    const manager = new PluginManager();
    manager.createContext(mockTrack, mockConfig);

    const p1 = createMockPlugin('p1');
    const p2 = createMockPlugin('p2');
    manager.register([p1, p2]);

    manager.destroy();
    expect(p1.destroy).toHaveBeenCalledOnce();
    expect(p2.destroy).toHaveBeenCalledOnce();
    expect(manager.getPluginNames()).toEqual([]);
  });

  it('should handle plugins without destroy method', () => {
    const manager = new PluginManager();
    manager.createContext(mockTrack, mockConfig);

    const plugin: FootprintPlugin = { name: 'no-destroy', setup: vi.fn() };
    manager.register([plugin]);

    expect(() => manager.destroy()).not.toThrow();
  });

  it('should apply beforeSend callbacks', () => {
    const manager = new PluginManager();
    manager.createContext(mockTrack, mockConfig);

    const plugin: FootprintPlugin = {
      name: 'filter-plugin',
      setup(ctx) {
        ctx.onBeforeSend((events) => events.filter((e) => e.eventName !== 'skip'));
      },
    };
    manager.register([plugin]);

    const events = [createMockEvent('keep'), createMockEvent('skip'), createMockEvent('keep')];
    const result = manager.applyBeforeSend(events);

    expect(result.length).toBe(2);
    expect(result.every((e) => e.eventName === 'keep')).toBe(true);
    manager.destroy();
  });

  it('should chain multiple beforeSend callbacks', () => {
    const manager = new PluginManager();
    manager.createContext(mockTrack, mockConfig);

    const plugin1: FootprintPlugin = {
      name: 'add-prop',
      setup(ctx) {
        ctx.onBeforeSend((events) =>
          events.map((e) => ({ ...e, properties: { ...e.properties, added: true } })),
        );
      },
    };

    const plugin2: FootprintPlugin = {
      name: 'filter',
      setup(ctx) {
        ctx.onBeforeSend((events) => events.filter((e) => e.eventName !== 'remove'));
      },
    };

    manager.register([plugin1, plugin2]);

    const events = [createMockEvent('keep'), createMockEvent('remove')];
    const result = manager.applyBeforeSend(events);

    expect(result.length).toBe(1);
    expect(result[0].properties).toHaveProperty('added', true);
    manager.destroy();
  });

  it('should provide config via context', () => {
    const manager = new PluginManager();
    manager.createContext(mockTrack, mockConfig);

    let receivedConfig: unknown;
    const plugin: FootprintPlugin = {
      name: 'config-reader',
      setup(ctx) {
        receivedConfig = ctx.getConfig();
      },
    };
    manager.register([plugin]);

    expect(receivedConfig).toEqual(mockConfig);
    manager.destroy();
  });

  it('should provide track via context', () => {
    const manager = new PluginManager();
    manager.createContext(mockTrack, mockConfig);

    const plugin: FootprintPlugin = {
      name: 'tracker',
      setup(ctx) {
        ctx.track('plugin_event', { source: 'plugin' });
      },
    };
    manager.register([plugin]);

    expect(mockTrack).toHaveBeenCalledWith('plugin_event', { source: 'plugin' });
    manager.destroy();
  });
});
