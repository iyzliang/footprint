import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities';
import { QueryEventsDto } from './dto';

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
}
