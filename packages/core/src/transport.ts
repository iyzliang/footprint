import type { TrackEvent, TransportData } from './types';
import { storage } from './utils/storage';

const FAILED_EVENTS_KEY = 'failed_events';
const DEFAULT_MAX_RETRIES = 3;

export interface TransportOptions {
  serverUrl: string;
  appId: string;
  maxRetries?: number;
}

export class Transport {
  private serverUrl: string;
  private appId: string;
  private maxRetries: number;

  constructor(options: TransportOptions) {
    this.serverUrl = options.serverUrl;
    this.appId = options.appId;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  async send(events: TrackEvent[]): Promise<boolean> {
    if (events.length === 0) return true;

    const data: TransportData = {
      appId: this.appId,
      events,
    };

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(this.serverUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          keepalive: true,
        });

        if (response.ok || response.status === 204) {
          return true;
        }

        if (response.status >= 400 && response.status < 500) {
          return false;
        }
      } catch {
        // Network error — retry
      }

      if (attempt < this.maxRetries) {
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    this.storeFailedEvents(events);
    return false;
  }

  sendBeacon(events: TrackEvent[]): boolean {
    if (events.length === 0) return true;

    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
      this.storeFailedEvents(events);
      return false;
    }

    const data: TransportData = {
      appId: this.appId,
      events,
    };

    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const success = navigator.sendBeacon(this.serverUrl, blob);

    if (!success) {
      this.storeFailedEvents(events);
    }

    return success;
  }

  getFailedEvents(): TrackEvent[] {
    const stored = storage.get(FAILED_EVENTS_KEY);
    if (!stored) return [];

    try {
      const events = JSON.parse(stored) as TrackEvent[];
      return Array.isArray(events) ? events : [];
    } catch {
      return [];
    }
  }

  clearFailedEvents(): void {
    storage.remove(FAILED_EVENTS_KEY);
  }

  async retryFailedEvents(): Promise<void> {
    const failed = this.getFailedEvents();
    if (failed.length === 0) return;

    this.clearFailedEvents();
    await this.send(failed);
  }

  private storeFailedEvents(events: TrackEvent[]): void {
    const existing = this.getFailedEvents();
    const combined = [...existing, ...events];

    // Cap stored events to prevent unbounded growth
    const capped = combined.slice(-200);
    storage.set(FAILED_EVENTS_KEY, JSON.stringify(capped));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
