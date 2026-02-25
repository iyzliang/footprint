import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { autoTrack } from '../src/plugins/auto-track';
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

describe('autoTrack plugin', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should have correct plugin name', () => {
    const plugin = autoTrack();
    expect(plugin.name).toBe('autoTrack');
  });

  describe('page view tracking', () => {
    it('should track initial page view on setup', () => {
      const ctx = createMockContext();
      const plugin = autoTrack({ click: false, pageLeave: false });
      plugin.setup(ctx);

      expect(ctx.trackCalls.length).toBe(1);
      expect(ctx.trackCalls[0][0]).toBe('page_view');
      expect(ctx.trackCalls[0][1]).toHaveProperty('url');
      expect(ctx.trackCalls[0][1]).toHaveProperty('path');

      plugin.destroy?.();
    });

    it('should track page view on popstate', () => {
      const ctx = createMockContext();
      const plugin = autoTrack({ click: false, pageLeave: false });
      plugin.setup(ctx);

      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(ctx.trackCalls.length).toBe(2);
      expect(ctx.trackCalls[1][0]).toBe('page_view');

      plugin.destroy?.();
    });

    it('should track page view on pushState', () => {
      const ctx = createMockContext();
      const plugin = autoTrack({ click: false, pageLeave: false });
      plugin.setup(ctx);

      history.pushState({}, '', '/new-page');

      expect(ctx.trackCalls.length).toBe(2);
      expect(ctx.trackCalls[1][0]).toBe('page_view');

      plugin.destroy?.();
    });

    it('should track page view on replaceState', () => {
      const ctx = createMockContext();
      const plugin = autoTrack({ click: false, pageLeave: false });
      plugin.setup(ctx);

      history.replaceState({}, '', '/replaced');

      expect(ctx.trackCalls.length).toBe(2);
      expect(ctx.trackCalls[1][0]).toBe('page_view');

      plugin.destroy?.();
    });

    it('should not track page view when disabled', () => {
      const ctx = createMockContext();
      const plugin = autoTrack({ pageView: false, click: false, pageLeave: false });
      plugin.setup(ctx);

      expect(ctx.trackCalls.length).toBe(0);

      plugin.destroy?.();
    });
  });

  describe('click tracking', () => {
    it('should track element clicks', () => {
      const ctx = createMockContext();
      const plugin = autoTrack({ pageView: false, pageLeave: false });
      plugin.setup(ctx);

      const btn = document.createElement('button');
      btn.textContent = 'Click Me';
      document.body.appendChild(btn);
      btn.click();

      expect(ctx.trackCalls.length).toBe(1);
      expect(ctx.trackCalls[0][0]).toBe('element_click');
      expect(ctx.trackCalls[0][1].tagName).toBe('button');
      expect(ctx.trackCalls[0][1].text).toBe('Click Me');

      document.body.removeChild(btn);
      plugin.destroy?.();
    });

    it('should capture data-track attribute', () => {
      const ctx = createMockContext();
      const plugin = autoTrack({ pageView: false, pageLeave: false });
      plugin.setup(ctx);

      const btn = document.createElement('button');
      btn.setAttribute('data-track', 'cta-button');
      btn.textContent = 'CTA';
      document.body.appendChild(btn);
      btn.click();

      expect(ctx.trackCalls[0][1].dataTrack).toBe('cta-button');

      document.body.removeChild(btn);
      plugin.destroy?.();
    });

    it('should respect clickSelector filter', () => {
      const ctx = createMockContext();
      const plugin = autoTrack({
        pageView: false,
        pageLeave: false,
        clickSelector: '.track-me',
      });
      plugin.setup(ctx);

      const btn1 = document.createElement('button');
      btn1.className = 'track-me';
      document.body.appendChild(btn1);

      const btn2 = document.createElement('button');
      btn2.className = 'ignore-me';
      document.body.appendChild(btn2);

      btn1.click();
      expect(ctx.trackCalls.length).toBe(1);

      btn2.click();
      expect(ctx.trackCalls.length).toBe(1);

      document.body.removeChild(btn1);
      document.body.removeChild(btn2);
      plugin.destroy?.();
    });

    it('should not track clicks when disabled', () => {
      const ctx = createMockContext();
      const plugin = autoTrack({ pageView: false, click: false, pageLeave: false });
      plugin.setup(ctx);

      const btn = document.createElement('button');
      document.body.appendChild(btn);
      btn.click();

      expect(ctx.trackCalls.length).toBe(0);

      document.body.removeChild(btn);
      plugin.destroy?.();
    });
  });

  describe('page leave tracking', () => {
    it('should track page leave on beforeunload', () => {
      const ctx = createMockContext();
      const plugin = autoTrack({ pageView: false, click: false });
      plugin.setup(ctx);

      vi.advanceTimersByTime(3000);
      window.dispatchEvent(new Event('beforeunload'));

      expect(ctx.trackCalls.length).toBe(1);
      expect(ctx.trackCalls[0][0]).toBe('page_leave');
      expect(ctx.trackCalls[0][1]).toHaveProperty('duration');
      expect(ctx.trackCalls[0][1].duration).toBeGreaterThanOrEqual(3000);

      plugin.destroy?.();
    });

    it('should track page leave on visibility hidden', () => {
      const ctx = createMockContext();
      const plugin = autoTrack({ pageView: false, click: false });
      plugin.setup(ctx);

      vi.advanceTimersByTime(2000);

      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(ctx.trackCalls.length).toBe(1);
      expect(ctx.trackCalls[0][0]).toBe('page_leave');

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      });

      plugin.destroy?.();
    });

    it('should not track page leave when disabled', () => {
      const ctx = createMockContext();
      const plugin = autoTrack({ pageView: false, click: false, pageLeave: false });
      plugin.setup(ctx);

      window.dispatchEvent(new Event('beforeunload'));
      expect(ctx.trackCalls.length).toBe(0);

      plugin.destroy?.();
    });
  });

  describe('destroy', () => {
    it('should clean up all listeners on destroy', () => {
      const ctx = createMockContext();
      const plugin = autoTrack({ pageView: false, pageLeave: false });
      plugin.setup(ctx);

      plugin.destroy?.();

      const btn = document.createElement('button');
      document.body.appendChild(btn);
      btn.click();

      expect(ctx.trackCalls.length).toBe(0);
      document.body.removeChild(btn);
    });

    it('should stop tracking pushState/replaceState after destroy', () => {
      const ctx = createMockContext();
      const plugin = autoTrack({ click: false, pageLeave: false });
      plugin.setup(ctx);

      const countBefore = ctx.trackCalls.length;

      plugin.destroy?.();

      history.pushState({}, '', '/after-destroy');
      history.replaceState({}, '', '/after-destroy-2');

      expect(ctx.trackCalls.length).toBe(countBefore);
    });
  });
});
