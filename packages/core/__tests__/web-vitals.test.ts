import { describe, it, expect, vi } from 'vitest';
import { webVitals } from '../src/plugins/web-vitals';
import type { PluginContext, FootprintConfigReadonly } from '../src/types';

function createMockContext(): PluginContext & { trackCalls: [string, Record<string, unknown>][] } {
  const trackCalls: [string, Record<string, unknown>][] = [];
  const config: FootprintConfigReadonly = {
    appId: 'test',
    serverUrl: 'http://test',
    debug: false,
  };

  return {
    trackCalls,
    track: (name: string, props?: Record<string, unknown>) => {
      trackCalls.push([name, props || {}]);
    },
    getConfig: () => config,
    onBeforeSend: vi.fn(),
  };
}

describe('webVitals plugin', () => {
  it('should have correct plugin name', () => {
    const plugin = webVitals();
    expect(plugin.name).toBe('webVitals');
  });

  it('should call setup without throwing', () => {
    const ctx = createMockContext();
    const plugin = webVitals();
    expect(() => plugin.setup(ctx)).not.toThrow();
  });

  it('should accept reportAllChanges option', () => {
    const plugin = webVitals({ reportAllChanges: true });
    expect(plugin.name).toBe('webVitals');
  });

  it('should handle missing web-vitals gracefully', async () => {
    vi.mock('web-vitals', () => {
      throw new Error('Module not found');
    });

    const ctx = createMockContext();
    const plugin = webVitals();
    expect(() => plugin.setup(ctx)).not.toThrow();

    vi.restoreAllMocks();
  });
});
