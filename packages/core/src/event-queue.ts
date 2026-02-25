import type { TrackEvent } from './types';
import { Transport } from './transport';

const DEFAULT_FLUSH_THRESHOLD = 10;
const DEFAULT_FLUSH_INTERVAL = 5000;

export interface EventQueueOptions {
  transport: Transport;
  flushThreshold?: number;
  flushInterval?: number;
}

export class EventQueue {
  private queue: TrackEvent[] = [];
  private transport: Transport;
  private flushThreshold: number;
  private flushInterval: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private unloadHandler: (() => void) | null = null;
  private visibilityHandler: (() => void) | null = null;
  private isFlushing = false;

  constructor(options: EventQueueOptions) {
    this.transport = options.transport;
    this.flushThreshold = options.flushThreshold ?? DEFAULT_FLUSH_THRESHOLD;
    this.flushInterval = options.flushInterval ?? DEFAULT_FLUSH_INTERVAL;

    this.startTimer();
    this.setupPageLifecycleListeners();
  }

  enqueue(event: TrackEvent): void {
    this.queue.push(event);

    if (this.queue.length >= this.flushThreshold) {
      void this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) return;

    this.isFlushing = true;
    const events = this.queue.splice(0);

    try {
      await this.transport.send(events);
    } finally {
      this.isFlushing = false;
    }
  }

  flushSync(): void {
    if (this.queue.length === 0) return;

    const events = this.queue.splice(0);
    this.transport.sendBeacon(events);
  }

  size(): number {
    return this.queue.length;
  }

  destroy(): void {
    this.stopTimer();
    this.flushSync();
    this.removePageLifecycleListeners();
  }

  private startTimer(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.flush();
    }, this.flushInterval);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private setupPageLifecycleListeners(): void {
    if (typeof window === 'undefined') return;

    this.unloadHandler = () => {
      this.flushSync();
    };

    this.visibilityHandler = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        this.flushSync();
      }
    };

    window.addEventListener('beforeunload', this.unloadHandler);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  private removePageLifecycleListeners(): void {
    if (typeof window === 'undefined') return;

    if (this.unloadHandler) {
      window.removeEventListener('beforeunload', this.unloadHandler);
      this.unloadHandler = null;
    }
    if (this.visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }
}
