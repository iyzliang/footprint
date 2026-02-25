import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Readable } from 'stream';
import { Event } from '../entities';
import { QueryEventsDto, ExportEventsDto } from './dto';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async findAll(query: QueryEventsDto) {
    const { projectId, eventName, userId, anonymousId, sessionId, startTime, endTime } = query;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const qb = this.eventRepository.createQueryBuilder('event');

    qb.where('event.projectId = :projectId', { projectId });

    if (eventName) {
      qb.andWhere('event.eventName = :eventName', { eventName });
    }

    if (userId) {
      qb.andWhere('event.userId = :userId', { userId });
    }

    if (anonymousId) {
      qb.andWhere('event.anonymousId = :anonymousId', { anonymousId });
    }

    if (sessionId) {
      qb.andWhere('event.sessionId = :sessionId', { sessionId });
    }

    if (startTime) {
      qb.andWhere('event.timestamp >= :startTime', {
        startTime: new Date(startTime).getTime(),
      });
    }

    if (endTime) {
      qb.andWhere('event.timestamp <= :endTime', {
        endTime: new Date(endTime).getTime(),
      });
    }

    qb.orderBy('event.timestamp', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const event = await this.eventRepository.findOne({ where: { id } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async getEventNames(projectId: string) {
    const result = await this.eventRepository
      .createQueryBuilder('event')
      .select('DISTINCT event.eventName', 'eventName')
      .where('event.projectId = :projectId', { projectId })
      .orderBy('event.eventName', 'ASC')
      .getRawMany<{ eventName: string }>();

    return result.map((r) => r.eventName);
  }

  createExportStream(query: ExportEventsDto): Readable {
    const BATCH_SIZE = 500;
    const CSV_HEADERS = [
      'id',
      'eventName',
      'timestamp',
      'sessionId',
      'userId',
      'anonymousId',
      'pageUrl',
      'pageTitle',
      'referrer',
      'userAgent',
      'screenResolution',
      'language',
      'ip',
      'country',
      'city',
      'properties',
      'createdAt',
    ];

    const qb = this.buildFilterQuery(query);
    qb.orderBy('event.timestamp', 'DESC');

    let offset = 0;
    let headerSent = false;

    const readable = new Readable({
      read: async function () {
        try {
          if (!headerSent) {
            this.push(CSV_HEADERS.join(',') + '\n');
            headerSent = true;
          }

          const rows = await qb
            .skip(offset)
            .take(BATCH_SIZE)
            .getMany();

          if (rows.length === 0) {
            this.push(null);
            return;
          }

          for (const row of rows) {
            const line = CSV_HEADERS.map((header) => {
              const value = row[header as keyof Event];
              if (value === null || value === undefined) return '';
              if (header === 'properties') return escapeCsvField(JSON.stringify(value));
              if (header === 'timestamp') return new Date(Number(value)).toISOString();
              if (value instanceof Date) return value.toISOString();
              return escapeCsvField(String(value));
            }).join(',');
            this.push(line + '\n');
          }

          offset += rows.length;
        } catch {
          this.destroy(new Error('Failed to export events'));
        }
      },
    });

    return readable;
  }

  private buildFilterQuery(
    query: ExportEventsDto,
  ): SelectQueryBuilder<Event> {
    const { projectId, eventName, userId, anonymousId, sessionId, startTime, endTime } = query;
    const qb = this.eventRepository.createQueryBuilder('event');

    qb.where('event.projectId = :projectId', { projectId });

    if (eventName) {
      qb.andWhere('event.eventName = :eventName', { eventName });
    }
    if (userId) {
      qb.andWhere('event.userId = :userId', { userId });
    }
    if (anonymousId) {
      qb.andWhere('event.anonymousId = :anonymousId', { anonymousId });
    }
    if (sessionId) {
      qb.andWhere('event.sessionId = :sessionId', { sessionId });
    }
    if (startTime) {
      qb.andWhere('event.timestamp >= :startTime', {
        startTime: new Date(startTime).getTime(),
      });
    }
    if (endTime) {
      qb.andWhere('event.timestamp <= :endTime', {
        endTime: new Date(endTime).getTime(),
      });
    }

    return qb;
  }
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}
