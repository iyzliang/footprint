import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectController } from './collect.controller';
import { CollectService } from './collect.service';
import { EventQueueService } from './event-queue.service';
import { AppIdGuard } from './guards/app-id.guard';
import { Event, Project } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Project])],
  controllers: [CollectController],
  providers: [CollectService, EventQueueService, AppIdGuard],
  exports: [EventQueueService],
})
export class CollectModule {}
