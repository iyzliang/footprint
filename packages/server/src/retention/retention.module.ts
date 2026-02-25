import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetentionService } from './retention.service';
import { Event } from '../entities/event.entity';
import { Project } from '../entities/project.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Project, Event]),
  ],
  providers: [RetentionService],
})
export class RetentionModule {}
