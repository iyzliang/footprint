import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Transport } from '../src/transport';
import { storage } from '../src/utils/storage';
import type { TrackEvent } from '../src/types';

function createMockEvent(overrides: Partial<TrackEvent> = {}): TrackEvent {
  return {
    eventName: 'test_event',
    properties: {},
    timestamp: Date.now(),
    sessionId: 'session-1',
    anonymousId: 'anon-1',
    appId: 'test-app',
    page: { url: 'http://localhost', title: 'Test', referrer: '' },
    device: { ua: 'test-ua', screen: '1920x1080', language: 'en' },
    ...overrides,
  };
}

describe('Transport', () => {
  let transport: Transport;

  beforeEach(() => {
    localStorage.clear();
    storage._resetCache();
    vi.useFakeTimers();

    transport = new Transport({
      serverUrl: 'https://api.example.com/collect',
      appId: 'test-app',
      maxRetries: 1,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('send', () => {
    it('should return true for empty events', async () => {
      const result = await transport.send([]);
      expect(result).toBe(true);
    });

    it('should send events via fetch and return true on success', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      vi.stubGlobal('fetch', mockFetch);

      const events = [createMockEvent()];
      const result = await transport.send(events);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledOnce();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/collect',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('should return false on 4xx client error without retry', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 400 });
      vi.stubGlobal('fetch', mockFetch);

      const result = await transport.send([createMockEvent()]);
      expect(result).toBe(false);
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it('should retry on server error and store failed events', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
      vi.stubGlobal('fetch', mockFetch);

      const sendPromise = transport.send([createMockEvent()]);

      // Advance through retry delays
      await vi.advanceTimersByTimeAsync(5000);
      const result = await sendPromise;

      expect(result).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(2); // initial + 1 retry
    });

    it('should retry on network error', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);

      const sendPromise = transport.send([createMockEvent()]);
      await vi.advanceTimersByTimeAsync(5000);
      const result = await sendPromise;

      expect(result).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should return true on 204 status', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 204 });
      vi.stubGlobal('fetch', mockFetch);

      const result = await transport.send([createMockEvent()]);
      expect(result).toBe(true);
    });
  });

  describe('sendBeacon', () => {
    it('should return true for empty events', () => {
      const result = transport.sendBeacon([]);
      expect(result).toBe(true);
    });

    it('should use navigator.sendBeacon', () => {
      const mockSendBeacon = vi.fn().mockReturnValue(true);
      vi.stubGlobal('navigator', { sendBeacon: mockSendBeacon });

      const result = transport.sendBeacon([createMockEvent()]);
      expect(result).toBe(true);
      expect(mockSendBeacon).toHaveBeenCalledOnce();
    });

    it('should store failed events when sendBeacon returns false', () => {
      const mockSendBeacon = vi.fn().mockReturnValue(false);
      vi.stubGlobal('navigator', { sendBeacon: mockSendBeacon });

      transport.sendBeacon([createMockEvent()]);
      const failed = transport.getFailedEvents();
      expect(failed.length).toBe(1);
    });
  });

  describe('failed events storage', () => {
    it('should store and retrieve failed events', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('fail'));
      vi.stubGlobal('fetch', mockFetch);

      const event = createMockEvent();
      const sendPromise = transport.send([event]);
      await vi.advanceTimersByTimeAsync(5000);
      await sendPromise;

      const failed = transport.getFailedEvents();
      expect(failed.length).toBe(1);
      expect(failed[0].eventName).toBe('test_event');
    });

    it('should clear failed events', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('fail'));
      vi.stubGlobal('fetch', mockFetch);

      const sendPromise = transport.send([createMockEvent()]);
      await vi.advanceTimersByTimeAsync(5000);
      await sendPromise;

      transport.clearFailedEvents();
      expect(transport.getFailedEvents().length).toBe(0);
    });

    it('should cap stored events at 200', async () => {
      const events = Array.from({ length: 250 }, (_, i) =>
        createMockEvent({ eventName: `event_${i}` }),
      );

      const mockFetch = vi.fn().mockRejectedValue(new Error('fail'));
      vi.stubGlobal('fetch', mockFetch);

      const sendPromise = transport.send(events);
      await vi.advanceTimersByTimeAsync(5000);
      await sendPromise;

      const failed = transport.getFailedEvents();
      expect(failed.length).toBe(200);
    });

    it('should retry failed events on retryFailedEvents call', async () => {
      storage.set(
        'failed_events',
        JSON.stringify([createMockEvent({ eventName: 'retry_event' })]),
      );

      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      vi.stubGlobal('fetch', mockFetch);

      await transport.retryFailedEvents();
      expect(mockFetch).toHaveBeenCalledOnce();
    });
  });
});
