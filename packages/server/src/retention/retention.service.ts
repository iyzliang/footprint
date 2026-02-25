import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Event } from '../entities/event.entity';
import { Project } from '../entities/project.entity';

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);
  private static readonly DELETE_BATCH_SIZE = 1000;

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleRetentionCleanup() {
    this.logger.log('Starting data retention cleanup...');

    const projects = await this.projectRepository.find({
      select: ['id', 'name', 'dataRetentionDays'],
    });

    let totalDeleted = 0;

    for (const project of projects) {
      if (!project.dataRetentionDays || project.dataRetentionDays <= 0) {
        continue;
      }

      const deleted = await this.cleanupProjectEvents(
        project.id,
        project.dataRetentionDays,
      );

      if (deleted > 0) {
        this.logger.log(
          `Cleaned up ${deleted} expired events for project "${project.name}" (retention: ${project.dataRetentionDays} days)`,
        );
      }

      totalDeleted += deleted;
    }

    this.logger.log(`Data retention cleanup completed. Total deleted: ${totalDeleted}`);
  }

  private async cleanupProjectEvents(
    projectId: string,
    retentionDays: number,
  ): Promise<number> {
    const cutoffTimestamp =
      Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    let totalDeleted = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const batch = await this.eventRepository.find({
        select: ['id'],
        where: {
          projectId,
          timestamp: LessThan(cutoffTimestamp),
        },
        take: RetentionService.DELETE_BATCH_SIZE,
      });

      if (batch.length === 0) {
        break;
      }

      const ids = batch.map((e) => e.id);
      await this.eventRepository.delete(ids);
      totalDeleted += ids.length;

      if (batch.length < RetentionService.DELETE_BATCH_SIZE) {
        break;
      }
    }

    return totalDeleted;
  }
}
