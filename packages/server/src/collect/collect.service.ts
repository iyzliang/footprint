import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as geoip from 'geoip-lite';
import { Project } from '../entities';
import { EventItemDto } from './dto';
import { EventQueueService } from './event-queue.service';

@Injectable()
export class CollectService {
  private readonly enableGeoip: boolean;

  constructor(
    private readonly eventQueueService: EventQueueService,
    private readonly configService: ConfigService,
  ) {
    this.enableGeoip = this.configService.get<boolean>('ENABLE_GEOIP', true);
  }

  collect(events: EventItemDto[], project: Project, ip: string) {
    let country: string | undefined;
    let city: string | undefined;

    if (this.enableGeoip && ip) {
      const geo = geoip.lookup(ip);
      if (geo) {
        country = geo.country;
        city = geo.city;
      }
    }

    const queuedEvents = events.map((event) => ({
      projectId: project.id,
      eventName: event.eventName,
      properties: event.properties || {},
      timestamp: event.timestamp,
      sessionId: event.sessionId,
      userId: event.userId,
      anonymousId: event.anonymousId,
      pageUrl: event.pageUrl,
      pageTitle: event.pageTitle,
      referrer: event.referrer,
      userAgent: event.userAgent,
      screenResolution: event.screenResolution,
      language: event.language,
      ip,
      country,
      city,
    }));

    this.eventQueueService.enqueue(queuedEvents);

    return { accepted: events.length };
  }
}
