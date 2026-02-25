import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Footprint } from '../src/footprint';
import { storage } from '../src/utils/storage';
import { resetAnonymousId } from '../src/utils/anonymous-id';
import type { FootprintPlugin } from '../src/types';

describe('Footprint', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    storage._resetCache();
    resetAnonymousId();
    vi.useFakeTimers();

    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('init', () => {
    it('should create an instance with valid config', () => {
      const fp = Footprint.init({
        appId: 'test-app',
        serverUrl: 'https://api.example.com/collect',
      });
      expect(fp).toBeInstanceOf(Footprint);
      fp.destroy();
    });

    it('should throw if appId is missing', () => {
      expect(() =>
        Footprint.init({ appId: '', serverUrl: 'https://api.example.com/collect' }),
      ).toThrow('appId is required');
    });

    it('should throw if serverUrl is missing', () => {
      expect(() => Footprint.init({ appId: 'test', serverUrl: '' })).toThrow(
        'serverUrl is required',
      );
    });
  });

  describe('track', () => {
    it('should enqueue an event and send on flush', async () => {
      const fp = Footprint.init({
        appId: 'test-app',
        serverUrl: 'https://api.example.com/collect',
        flushThreshold: 100,
      });

      fp.track('button_click', { buttonId: 'submit' });
      await fp.flush();

      expect(fetchMock).toHaveBeenCalledOnce();
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.appId).toBe('test-app');
      expect(body.events).toHaveLength(1);
      expect(body.events[0].eventName).toBe('button_click');
      expect(body.events[0].properties.buttonId).toBe('submit');

      fp.destroy();
    });

    it('should auto-flush when threshold is reached', () => {
      const fp = Footprint.init({
        appId: 'test-app',
        serverUrl: 'https://api.example.com/collect',
        flushThreshold: 2,
      });

      fp.track('e1');
      expect(fetchMock).not.toHaveBeenCalled();

      fp.track('e2');
      expect(fetchMock).toHaveBeenCalledOnce();

      fp.destroy();
    });

    it('should include page and device info', async () => {
      const fp = Footprint.init({
        appId: 'test-app',
        serverUrl: 'https://api.example.com/collect',
        flushThreshold: 100,
      });

      fp.track('test_event');
      await fp.flush();

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      const event = body.events[0];
      expect(event.page).toHaveProperty('url');
      expect(event.page).toHaveProperty('title');
      expect(event.device).toHaveProperty('ua');
      expect(event.device).toHaveProperty('screen');

      fp.destroy();
    });

    it('should include sessionId and anonymousId', async () => {
      const fp = Footprint.init({
        appId: 'test-app',
        serverUrl: 'https://api.example.com/collect',
        flushThreshold: 100,
      });

      fp.track('test_event');
      await fp.flush();

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      const event = body.events[0];
      expect(event.sessionId).toBeTruthy();
      expect(event.anonymousId).toBeTruthy();

      fp.destroy();
    });

    it('should warn when tracking after destroy', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const fp = Footprint.init({
        appId: 'test-app',
        serverUrl: 'https://api.example.com/collect',
      });

      fp.destroy();
      fp.track('after_destroy');

      expect(warnSpy).toHaveBeenCalledWith('Footprint: cannot track after destroy');
    });
  });

  describe('identify', () => {
    it('should attach userId to subsequent events', async () => {
      const fp = Footprint.init({
        appId: 'test-app',
        serverUrl: 'https://api.example.com/collect',
        flushThreshold: 100,
      });

      fp.identify('user-123');
      fp.track('test_event');
      await fp.flush();

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.events[0].userId).toBe('user-123');

      fp.destroy();
    });
  });

  describe('setGlobalProps', () => {
    it('should merge global props into events', async () => {
      const fp = Footprint.init({
        appId: 'test-app',
        serverUrl: 'https://api.example.com/collect',
        flushThreshold: 100,
      });

      fp.setGlobalProps({ version: '1.0.0', env: 'production' });
      fp.track('test_event', { custom: 'value' });
      await fp.flush();

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      const props = body.events[0].properties;
      expect(props.version).toBe('1.0.0');
      expect(props.env).toBe('production');
      expect(props.custom).toBe('value');

      fp.destroy();
    });

    it('should allow event props to override global props', async () => {
      const fp = Footprint.init({
        appId: 'test-app',
        serverUrl: 'https://api.example.com/collect',
        flushThreshold: 100,
      });

      fp.setGlobalProps({ key: 'global' });
      fp.track('test_event', { key: 'local' });
      await fp.flush();

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.events[0].properties.key).toBe('local');

      fp.destroy();
    });
  });

  describe('plugins', () => {
    it('should initialize plugins on init', () => {
      const setupFn = vi.fn();
      const plugin: FootprintPlugin = {
        name: 'test-plugin',
        setup: setupFn,
      };

      const fp = Footprint.init({
        appId: 'test-app',
        serverUrl: 'https://api.example.com/collect',
        plugins: [plugin],
      });

      expect(setupFn).toHaveBeenCalledOnce();
      fp.destroy();
    });

    it('should destroy plugins on destroy', () => {
      const destroyFn = vi.fn();
      const plugin: FootprintPlugin = {
        name: 'test-plugin',
        setup: vi.fn(),
        destroy: destroyFn,
      };

      const fp = Footprint.init({
        appId: 'test-app',
        serverUrl: 'https://api.example.com/collect',
        plugins: [plugin],
      });

      fp.destroy();
      expect(destroyFn).toHaveBeenCalledOnce();
    });

    it('should allow plugins to track events via context', async () => {
      const plugin: FootprintPlugin = {
        name: 'auto-plugin',
        setup(ctx) {
          ctx.track('plugin_init');
        },
      };

      const fp = Footprint.init({
        appId: 'test-app',
        serverUrl: 'https://api.example.com/collect',
        plugins: [plugin],
        flushThreshold: 100,
      });

      await fp.flush();

      expect(fetchMock).toHaveBeenCalledOnce();
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.events[0].eventName).toBe('plugin_init');

      fp.destroy();
    });
  });

  describe('debug mode', () => {
    it('should log when debug is true', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const fp = Footprint.init({
        appId: 'test-app',
        serverUrl: 'https://api.example.com/collect',
        debug: true,
      });

      fp.track('debug_event');
      expect(logSpy).toHaveBeenCalled();

      fp.destroy();
    });

    it('should not log when debug is false', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const fp = Footprint.init({
        appId: 'test-app',
        serverUrl: 'https://api.example.com/collect',
        debug: false,
      });

      fp.track('silent_event');
      expect(logSpy).not.toHaveBeenCalled();

      fp.destroy();
    });
  });
});
