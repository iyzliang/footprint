import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EventQueue } from '../src/event-queue';
import { Transport } from '../src/transport';
import { storage } from '../src/utils/storage';
import type { TrackEvent } from '../src/types';

function createMockEvent(name = 'test_event'): TrackEvent {
  return {
    eventName: name,
    properties: {},
    timestamp: Date.now(),
    sessionId: 'session-1',
    anonymousId: 'anon-1',
    appId: 'test-app',
    page: { url: 'http://localhost', title: 'Test', referrer: '' },
    device: { ua: 'test-ua', screen: '1920x1080', language: 'en' },
  };
}

describe('EventQueue', () => {
  let transport: Transport;
  let sendSpy: ReturnType<typeof vi.spyOn>;
  let sendBeaconSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    storage._resetCache();
    vi.useFakeTimers();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));

    transport = new Transport({
      serverUrl: 'https://api.example.com/collect',
      appId: 'test-app',
    });

    sendSpy = vi.spyOn(transport, 'send').mockResolvedValue(true);
    sendBeaconSpy = vi.spyOn(transport, 'sendBeacon').mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should enqueue events', () => {
    const queue = new EventQueue({ transport, flushThreshold: 20 });
    queue.enqueue(createMockEvent());
    expect(queue.size()).toBe(1);
    queue.destroy();
  });

  it('should flush when threshold is reached', () => {
    const queue = new EventQueue({ transport, flushThreshold: 3 });

    queue.enqueue(createMockEvent('e1'));
    queue.enqueue(createMockEvent('e2'));
    expect(sendSpy).not.toHaveBeenCalled();

    queue.enqueue(createMockEvent('e3'));
    expect(sendSpy).toHaveBeenCalledOnce();
    expect(sendSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ eventName: 'e1' }),
        expect.objectContaining({ eventName: 'e2' }),
        expect.objectContaining({ eventName: 'e3' }),
      ]),
    );
    expect(queue.size()).toBe(0);
    queue.destroy();
  });

  it('should flush on timer interval', async () => {
    const queue = new EventQueue({ transport, flushThreshold: 100, flushInterval: 2000 });

    queue.enqueue(createMockEvent());
    expect(sendSpy).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2000);
    expect(sendSpy).toHaveBeenCalledOnce();
    queue.destroy();
  });

  it('should not flush when queue is empty on timer', async () => {
    const queue = new EventQueue({ transport, flushThreshold: 100, flushInterval: 2000 });

    await vi.advanceTimersByTimeAsync(2000);
    expect(sendSpy).not.toHaveBeenCalled();
    queue.destroy();
  });

  it('should flush manually', async () => {
    const queue = new EventQueue({ transport, flushThreshold: 100 });

    queue.enqueue(createMockEvent());
    await queue.flush();

    expect(sendSpy).toHaveBeenCalledOnce();
    expect(queue.size()).toBe(0);
    queue.destroy();
  });

  it('should use sendBeacon on flushSync', () => {
    const queue = new EventQueue({ transport, flushThreshold: 100 });

    queue.enqueue(createMockEvent());
    queue.flushSync();

    expect(sendBeaconSpy).toHaveBeenCalledOnce();
    expect(queue.size()).toBe(0);
    queue.destroy();
  });

  it('should use sendBeacon on beforeunload', () => {
    const queue = new EventQueue({ transport, flushThreshold: 100 });

    queue.enqueue(createMockEvent());
    window.dispatchEvent(new Event('beforeunload'));

    expect(sendBeaconSpy).toHaveBeenCalledOnce();
    queue.destroy();
  });

  it('should use sendBeacon when page becomes hidden', () => {
    const queue = new EventQueue({ transport, flushThreshold: 100 });

    queue.enqueue(createMockEvent());

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(sendBeaconSpy).toHaveBeenCalledOnce();
    queue.destroy();

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });
  });

  it('should flush remaining events on destroy', () => {
    const queue = new EventQueue({ transport, flushThreshold: 100 });

    queue.enqueue(createMockEvent());
    queue.destroy();

    expect(sendBeaconSpy).toHaveBeenCalledOnce();
    expect(queue.size()).toBe(0);
  });
});
