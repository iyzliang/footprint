import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ProjectMemberGuard } from './guards/project-member.guard';
import { Project, ProjectMember, User } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectMember, User])],
  controllers: [ProjectController],
  providers: [ProjectService, ProjectMemberGuard],
  exports: [ProjectService],
})
export class ProjectModule {}
