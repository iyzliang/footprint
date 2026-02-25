import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto, AddMemberDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectMemberGuard } from './guards/project-member.guard';

interface AuthRequest {
  user: { id: string; email: string; nickname: string };
}

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  create(@Body() dto: CreateProjectDto, @Request() req: AuthRequest) {
    return this.projectService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all projects for current user' })
  findAll(@Request() req: AuthRequest) {
    return this.projectService.findAllByUser(req.user.id);
  }

  @Get(':id')
  @UseGuards(ProjectMemberGuard)
  @ApiOperation({ summary: 'Get project details' })
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @Put(':id')
  @UseGuards(ProjectMemberGuard)
  @ApiOperation({ summary: 'Update project settings' })
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto, @Request() req: AuthRequest) {
    return this.projectService.update(id, dto, req.user.id);
  }

  @Post(':id/regenerate-secret')
  @UseGuards(ProjectMemberGuard)
  @ApiOperation({ summary: 'Regenerate project appSecret' })
  regenerateSecret(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.projectService.regenerateSecret(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(ProjectMemberGuard)
  @ApiOperation({ summary: 'Delete a project' })
  remove(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.projectService.remove(id, req.user.id);
  }

  @Post(':id/members')
  @UseGuards(ProjectMemberGuard)
  @ApiOperation({ summary: 'Add a member to the project' })
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto, @Request() req: AuthRequest) {
    return this.projectService.addMember(id, dto, req.user.id);
  }

  @Delete(':id/members/:memberId')
  @UseGuards(ProjectMemberGuard)
  @ApiOperation({ summary: 'Remove a member from the project' })
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Request() req: AuthRequest,
  ) {
    return this.projectService.removeMember(id, memberId, req.user.id);
  }
}
