import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { errorTrack } from '../src/plugins/error-track';
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

describe('errorTrack plugin', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should have correct plugin name', () => {
    const plugin = errorTrack();
    expect(plugin.name).toBe('errorTrack');
  });

  describe('JS error tracking', () => {
    it('should track JS errors', () => {
      const ctx = createMockContext();
      const plugin = errorTrack({ promiseError: false, resourceError: false });
      plugin.setup(ctx);

      const errorEvent = new ErrorEvent('error', {
        message: 'Test error',
        filename: 'test.js',
        lineno: 10,
        colno: 5,
        error: new Error('Test error'),
      });
      window.dispatchEvent(errorEvent);

      expect(ctx.trackCalls.length).toBe(1);
      expect(ctx.trackCalls[0][0]).toBe('js_error');
      expect(ctx.trackCalls[0][1].message).toBe('Test error');
      expect(ctx.trackCalls[0][1].filename).toBe('test.js');
      expect(ctx.trackCalls[0][1].lineno).toBe(10);
      expect(ctx.trackCalls[0][1].colno).toBe(5);

      plugin.destroy?.();
    });

    it('should not track JS errors when disabled', () => {
      const ctx = createMockContext();
      const plugin = errorTrack({ jsError: false, promiseError: false, resourceError: false });
      plugin.setup(ctx);

      window.dispatchEvent(
        new ErrorEvent('error', { message: 'Ignored', filename: 'test.js', lineno: 1 }),
      );

      expect(ctx.trackCalls.length).toBe(0);
      plugin.destroy?.();
    });
  });

  describe('Promise error tracking', () => {
    it('should track unhandled promise rejections with Error', () => {
      const ctx = createMockContext();
      const plugin = errorTrack({ jsError: false, resourceError: false });
      plugin.setup(ctx);

      const event = new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.resolve(),
        reason: new Error('Promise failed'),
      });
      window.dispatchEvent(event);

      expect(ctx.trackCalls.length).toBe(1);
      expect(ctx.trackCalls[0][0]).toBe('promise_error');
      expect(ctx.trackCalls[0][1].message).toBe('Promise failed');
      expect(ctx.trackCalls[0][1].type).toBe('promise_error');

      plugin.destroy?.();
    });

    it('should track unhandled promise rejections with string', () => {
      const ctx = createMockContext();
      const plugin = errorTrack({ jsError: false, resourceError: false });
      plugin.setup(ctx);

      const event = new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.resolve(),
        reason: 'string error',
      });
      window.dispatchEvent(event);

      expect(ctx.trackCalls.length).toBe(1);
      expect(ctx.trackCalls[0][1].message).toBe('string error');

      plugin.destroy?.();
    });

    it('should track unhandled promise rejections with object', () => {
      const ctx = createMockContext();
      const plugin = errorTrack({ jsError: false, resourceError: false });
      plugin.setup(ctx);

      const event = new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.resolve(),
        reason: { code: 500, msg: 'server error' },
      });
      window.dispatchEvent(event);

      expect(ctx.trackCalls.length).toBe(1);
      expect(ctx.trackCalls[0][1].message).toContain('500');

      plugin.destroy?.();
    });

    it('should not track promise errors when disabled', () => {
      const ctx = createMockContext();
      const plugin = errorTrack({ jsError: false, promiseError: false, resourceError: false });
      plugin.setup(ctx);

      window.dispatchEvent(
        new PromiseRejectionEvent('unhandledrejection', {
          promise: Promise.resolve(),
          reason: 'ignored',
        }),
      );

      expect(ctx.trackCalls.length).toBe(0);
      plugin.destroy?.();
    });
  });

  describe('deduplication', () => {
    it('should deduplicate same JS error within interval', () => {
      const ctx = createMockContext();
      const plugin = errorTrack({
        promiseError: false,
        resourceError: false,
        dedupeInterval: 5000,
      });
      plugin.setup(ctx);

      const makeError = () =>
        new ErrorEvent('error', {
          message: 'Duplicate error',
          filename: 'test.js',
          lineno: 1,
        });

      window.dispatchEvent(makeError());
      window.dispatchEvent(makeError());
      window.dispatchEvent(makeError());

      expect(ctx.trackCalls.length).toBe(1);

      plugin.destroy?.();
    });

    it('should report same error again after dedup interval', () => {
      const ctx = createMockContext();
      const plugin = errorTrack({
        promiseError: false,
        resourceError: false,
        dedupeInterval: 2000,
      });
      plugin.setup(ctx);

      const makeError = () =>
        new ErrorEvent('error', {
          message: 'Timed error',
          filename: 'test.js',
          lineno: 1,
        });

      window.dispatchEvent(makeError());
      expect(ctx.trackCalls.length).toBe(1);

      vi.advanceTimersByTime(3000);
      window.dispatchEvent(makeError());
      expect(ctx.trackCalls.length).toBe(2);

      plugin.destroy?.();
    });

    it('should not deduplicate different errors', () => {
      const ctx = createMockContext();
      const plugin = errorTrack({ promiseError: false, resourceError: false });
      plugin.setup(ctx);

      window.dispatchEvent(
        new ErrorEvent('error', { message: 'Error A', filename: 'a.js', lineno: 1 }),
      );
      window.dispatchEvent(
        new ErrorEvent('error', { message: 'Error B', filename: 'b.js', lineno: 2 }),
      );

      expect(ctx.trackCalls.length).toBe(2);

      plugin.destroy?.();
    });
  });

  describe('destroy', () => {
    it('should stop tracking after destroy', () => {
      const ctx = createMockContext();
      const plugin = errorTrack({ resourceError: false });
      plugin.setup(ctx);

      plugin.destroy?.();

      window.dispatchEvent(
        new ErrorEvent('error', { message: 'After destroy', filename: 'test.js', lineno: 1 }),
      );
      window.dispatchEvent(
        new PromiseRejectionEvent('unhandledrejection', {
          promise: Promise.resolve(),
          reason: 'after destroy',
        }),
      );

      expect(ctx.trackCalls.length).toBe(0);
    });
  });
});
