import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities';

interface QueuedEvent {
  projectId: string;
  eventName: string;
  properties: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
  userId?: string;
  anonymousId: string;
  pageUrl?: string;
  pageTitle?: string;
  referrer?: string;
  userAgent?: string;
  screenResolution?: string;
  language?: string;
  ip?: string;
  country?: string;
  city?: string;
}

@Injectable()
export class EventQueueService implements OnModuleDestroy {
  private queue: QueuedEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval>;
  private readonly batchSize = 100;
  private readonly flushInterval = 5000;

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
  }

  enqueue(events: QueuedEvent[]) {
    this.queue.push(...events);

    if (this.queue.length >= this.batchSize) {
      void this.flush();
    }
  }

  async flush() {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);

    try {
      const entities = batch.map((item) => this.eventRepository.create(item));
      await this.eventRepository.save(entities);
    } catch (error) {
      console.error('Failed to flush events to database:', error);
      this.queue.unshift(...batch);
    }
  }

  async onModuleDestroy() {
    clearInterval(this.flushTimer);
    await this.flush();
  }
}
