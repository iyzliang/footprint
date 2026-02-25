import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Project, ProjectMember, MemberRole, User } from '../entities';
import { CreateProjectDto, UpdateProjectDto, AddMemberDto } from './dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly memberRepository: Repository<ProjectMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateProjectDto, userId: string) {
    const appId = `fp_${randomBytes(12).toString('hex')}`;
    const appSecret = randomBytes(32).toString('hex');

    const project = this.projectRepository.create({
      name: dto.name,
      appId,
      appSecret,
      domainWhitelist: dto.domainWhitelist || [],
    });

    const saved = await this.projectRepository.save(project);

    const member = this.memberRepository.create({
      projectId: saved.id,
      userId,
      role: MemberRole.OWNER,
    });
    await this.memberRepository.save(member);

    return this.sanitizeProject(saved);
  }

  async findAllByUser(userId: string) {
    const members = await this.memberRepository.find({
      where: { userId },
      relations: ['project'],
    });

    return members.map((m) => ({
      ...this.sanitizeProject(m.project),
      role: m.role,
    }));
  }

  async findOne(projectId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['members', 'members.user'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return {
      ...this.sanitizeProject(project),
      members: project.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        email: m.user.email,
        nickname: m.user.nickname,
        role: m.role,
        createdAt: m.createdAt,
      })),
    };
  }

  async update(projectId: string, dto: UpdateProjectDto, userId: string) {
    await this.assertOwner(projectId, userId);

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    Object.assign(project, dto);
    const saved = await this.projectRepository.save(project);
    return this.sanitizeProject(saved);
  }

  async regenerateSecret(projectId: string, userId: string) {
    await this.assertOwner(projectId, userId);

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    project.appSecret = randomBytes(32).toString('hex');
    const saved = await this.projectRepository.save(project);

    return { appId: saved.appId, appSecret: saved.appSecret };
  }

  async remove(projectId: string, userId: string) {
    await this.assertOwner(projectId, userId);
    await this.projectRepository.delete(projectId);
    return { deleted: true };
  }

  async addMember(projectId: string, dto: AddMemberDto, userId: string) {
    await this.assertOwner(projectId, userId);

    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found with this email');
    }

    const existing = await this.memberRepository.findOne({
      where: { projectId, userId: user.id },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this project');
    }

    const member = this.memberRepository.create({
      projectId,
      userId: user.id,
      role: dto.role || MemberRole.MEMBER,
    });

    const saved = await this.memberRepository.save(member);
    return {
      id: saved.id,
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
      role: saved.role,
      createdAt: saved.createdAt,
    };
  }

  async removeMember(projectId: string, memberId: string, userId: string) {
    await this.assertOwner(projectId, userId);

    const member = await this.memberRepository.findOne({
      where: { id: memberId, projectId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === MemberRole.OWNER) {
      throw new ForbiddenException('Cannot remove the project owner');
    }

    await this.memberRepository.delete(memberId);
    return { deleted: true };
  }

  private async assertOwner(projectId: string, userId: string) {
    const member = await this.memberRepository.findOne({
      where: { projectId, userId, role: MemberRole.OWNER },
    });

    if (!member) {
      throw new ForbiddenException('Only the project owner can perform this action');
    }
  }

  private sanitizeProject(project: Project) {
    return {
      id: project.id,
      name: project.name,
      appId: project.appId,
      domainWhitelist: project.domainWhitelist,
      dataRetentionDays: project.dataRetentionDays,
      settings: project.settings,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
