import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities';
import {
  TrendQueryDto,
  Granularity,
  TopEventsQueryDto,
  FunnelQueryDto,
  WebVitalsQueryDto,
  PagePerformanceQueryDto,
  ErrorListQueryDto,
  ErrorDetailQueryDto,
} from './dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async getTrend(query: TrendQueryDto) {
    const { projectId, eventNames, startDate, endDate } = query;
    const granularity = query.granularity ?? Granularity.DAY;
    const startTs = new Date(startDate).getTime();
    const endTs = new Date(endDate).getTime() + 86400000 - 1;

    const dateFormat = granularity === Granularity.HOUR ? 'YYYY-MM-DD HH24:00' : 'YYYY-MM-DD';

    const results = await this.eventRepository
      .createQueryBuilder('event')
      .select(`TO_CHAR(TO_TIMESTAMP(event.timestamp / 1000), '${dateFormat}')`, 'period')
      .addSelect('event.eventName', 'eventName')
      .addSelect('COUNT(*)', 'count')
      .where('event.projectId = :projectId', { projectId })
      .andWhere('event.eventName IN (:...eventNames)', { eventNames })
      .andWhere('event.timestamp >= :startTs', { startTs })
      .andWhere('event.timestamp <= :endTs', { endTs })
      .groupBy('period')
      .addGroupBy('event.eventName')
      .orderBy('period', 'ASC')
      .getRawMany<{ period: string; eventName: string; count: string }>();

    const grouped: Record<string, { period: string; count: number }[]> = {};
    for (const name of eventNames) {
      grouped[name] = [];
    }

    for (const row of results) {
      if (!grouped[row.eventName]) grouped[row.eventName] = [];
      grouped[row.eventName].push({
        period: row.period,
        count: parseInt(row.count, 10),
      });
    }

    return grouped;
  }

  async getRealtime(projectId: string) {
    const now = Date.now();
    const thirtyMinAgo = now - 30 * 60 * 1000;

    const qb = this.eventRepository
      .createQueryBuilder('event')
      .where('event.projectId = :projectId', { projectId })
      .andWhere('event.timestamp >= :thirtyMinAgo', { thirtyMinAgo });

    const totalEvents = await qb.getCount();

    const uniqueUsers = await this.eventRepository
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.anonymousId)', 'count')
      .where('event.projectId = :projectId', { projectId })
      .andWhere('event.timestamp >= :thirtyMinAgo', { thirtyMinAgo })
      .getRawOne<{ count: string }>();

    const uniqueSessions = await this.eventRepository
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.sessionId)', 'count')
      .where('event.projectId = :projectId', { projectId })
      .andWhere('event.timestamp >= :thirtyMinAgo', { thirtyMinAgo })
      .getRawOne<{ count: string }>();

    const minuteTrend = await this.eventRepository
      .createQueryBuilder('event')
      .select(`TO_CHAR(TO_TIMESTAMP(event.timestamp / 1000), 'YYYY-MM-DD HH24:MI')`, 'minute')
      .addSelect('COUNT(*)', 'count')
      .where('event.projectId = :projectId', { projectId })
      .andWhere('event.timestamp >= :thirtyMinAgo', { thirtyMinAgo })
      .groupBy('minute')
      .orderBy('minute', 'ASC')
      .getRawMany<{ minute: string; count: string }>();

    return {
      totalEvents,
      uniqueUsers: parseInt(uniqueUsers?.count || '0', 10),
      uniqueSessions: parseInt(uniqueSessions?.count || '0', 10),
      minuteTrend: minuteTrend.map((r) => ({
        minute: r.minute,
        count: parseInt(r.count, 10),
      })),
    };
  }

  async getTopEvents(query: TopEventsQueryDto) {
    const { projectId, startDate, endDate } = query;
    const limit = query.limit ?? 10;
    const startTs = new Date(startDate).getTime();
    const endTs = new Date(endDate).getTime() + 86400000 - 1;

    const results = await this.eventRepository
      .createQueryBuilder('event')
      .select('event.eventName', 'eventName')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COUNT(DISTINCT event.anonymousId)', 'uniqueUsers')
      .where('event.projectId = :projectId', { projectId })
      .andWhere('event.timestamp >= :startTs', { startTs })
      .andWhere('event.timestamp <= :endTs', { endTs })
      .groupBy('event.eventName')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany<{ eventName: string; count: string; uniqueUsers: string }>();

    return results.map((r) => ({
      eventName: r.eventName,
      count: parseInt(r.count, 10),
      uniqueUsers: parseInt(r.uniqueUsers, 10),
    }));
  }

  async getFunnel(query: FunnelQueryDto) {
    const { projectId, steps, startDate, endDate } = query;
    const groupBy = query.groupBy ?? 'userId';
    const startTs = new Date(startDate).getTime();
    const endTs = new Date(endDate).getTime() + 86400000 - 1;

    const groupField = groupBy === 'userId' ? 'anonymous_id' : 'session_id';

    const funnelResults: { step: string; count: number; rate: number }[] = [];
    let previousUsers: Set<string> | null = null;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const qb = this.eventRepository
        .createQueryBuilder('event')
        .select(`DISTINCT event.${groupField}`, 'groupId')
        .where('event.projectId = :projectId', { projectId })
        .andWhere('event.eventName = :eventName', { eventName: step })
        .andWhere('event.timestamp >= :startTs', { startTs })
        .andWhere('event.timestamp <= :endTs', { endTs });

      const rows = await qb.getRawMany<{ groupId: string }>();
      const currentUsers = new Set(rows.map((r) => r.groupId));

      if (previousUsers) {
        const intersection = new Set([...currentUsers].filter((u) => previousUsers!.has(u)));
        previousUsers = intersection;
      } else {
        previousUsers = currentUsers;
      }

      const firstStepCount = funnelResults.length > 0 ? funnelResults[0].count : previousUsers.size;

      funnelResults.push({
        step,
        count: previousUsers.size,
        rate: firstStepCount > 0 ? previousUsers.size / firstStepCount : 0,
      });
    }

    return funnelResults;
  }

  async getWebVitals(query: WebVitalsQueryDto) {
    const { projectId, startDate, endDate } = query;
    const granularity = query.granularity ?? Granularity.DAY;
    const startTs = new Date(startDate).getTime();
    const endTs = new Date(endDate).getTime() + 86400000 - 1;

    const dateFormat = granularity === Granularity.HOUR ? 'YYYY-MM-DD HH24:00' : 'YYYY-MM-DD';

    const results = await this.eventRepository
      .createQueryBuilder('event')
      .select(`TO_CHAR(TO_TIMESTAMP(event.timestamp / 1000), '${dateFormat}')`, 'period')
      .addSelect("event.properties->>'name'", 'metricName')
      .addSelect("AVG((event.properties->>'value')::numeric)", 'avg')
      .addSelect(
        "PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY (event.properties->>'value')::numeric)",
        'p75',
      )
      .addSelect(
        "PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (event.properties->>'value')::numeric)",
        'p95',
      )
      .where('event.projectId = :projectId', { projectId })
      .andWhere("event.eventName = 'web_vitals'")
      .andWhere('event.timestamp >= :startTs', { startTs })
      .andWhere('event.timestamp <= :endTs', { endTs })
      .groupBy('period')
      .addGroupBy("event.properties->>'name'")
      .orderBy('period', 'ASC')
      .getRawMany();

    return results.map((r) => ({
      period: r.period,
      metricName: r.metricName,
      avg: parseFloat(r.avg),
      p75: parseFloat(r.p75),
      p95: parseFloat(r.p95),
    }));
  }

  async getPagePerformance(query: PagePerformanceQueryDto) {
    const { projectId, startDate, endDate } = query;
    const limit = query.limit ?? 10;
    const startTs = new Date(startDate).getTime();
    const endTs = new Date(endDate).getTime() + 86400000 - 1;

    const results = await this.eventRepository
      .createQueryBuilder('event')
      .select('event.pageUrl', 'pageUrl')
      .addSelect("AVG((event.properties->>'value')::numeric)", 'avgLoadTime')
      .addSelect('COUNT(*)', 'sampleCount')
      .where('event.projectId = :projectId', { projectId })
      .andWhere("event.eventName = 'web_vitals'")
      .andWhere("event.properties->>'name' = 'LCP'")
      .andWhere('event.timestamp >= :startTs', { startTs })
      .andWhere('event.timestamp <= :endTs', { endTs })
      .groupBy('event.pageUrl')
      .orderBy('"avgLoadTime"', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((r) => ({
      pageUrl: r.pageUrl,
      avgLoadTime: parseFloat(r.avgLoadTime),
      sampleCount: parseInt(r.sampleCount, 10),
    }));
  }

  async getErrorList(query: ErrorListQueryDto) {
    const { projectId, startDate, endDate } = query;
    const limit = query.limit ?? 20;
    const startTs = new Date(startDate).getTime();
    const endTs = new Date(endDate).getTime() + 86400000 - 1;

    const results = await this.eventRepository
      .createQueryBuilder('event')
      .select("event.properties->>'message'", 'message')
      .addSelect('event.eventName', 'errorType')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COUNT(DISTINCT event.anonymousId)', 'affectedUsers')
      .addSelect('MIN(event.timestamp)', 'firstSeen')
      .addSelect('MAX(event.timestamp)', 'lastSeen')
      .where('event.projectId = :projectId', { projectId })
      .andWhere("event.eventName IN ('js_error', 'promise_error', 'resource_error')")
      .andWhere('event.timestamp >= :startTs', { startTs })
      .andWhere('event.timestamp <= :endTs', { endTs })
      .groupBy("event.properties->>'message'")
      .addGroupBy('event.eventName')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((r) => ({
      message: r.message,
      errorType: r.errorType,
      count: parseInt(r.count, 10),
      affectedUsers: parseInt(r.affectedUsers, 10),
      firstSeen: parseInt(r.firstSeen, 10),
      lastSeen: parseInt(r.lastSeen, 10),
    }));
  }

  async getErrorDetail(query: ErrorDetailQueryDto) {
    const { projectId, message, startDate, endDate } = query;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const startTs = new Date(startDate).getTime();
    const endTs = new Date(endDate).getTime() + 86400000 - 1;

    const qb = this.eventRepository
      .createQueryBuilder('event')
      .where('event.projectId = :projectId', { projectId })
      .andWhere("event.eventName IN ('js_error', 'promise_error', 'resource_error')")
      .andWhere("event.properties->>'message' = :message", { message })
      .andWhere('event.timestamp >= :startTs', { startTs })
      .andWhere('event.timestamp <= :endTs', { endTs })
      .orderBy('event.timestamp', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
