import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../entities';

interface CacheEntry {
  project: Project;
  expiresAt: number;
}

@Injectable()
export class AppIdGuard implements CanActivate {
  private cache = new Map<string, CacheEntry>();
  private readonly cacheTTL = 5 * 60 * 1000;

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const appId = request.body?.appId || request.headers['x-app-id'];

    if (!appId) {
      throw new UnauthorizedException('Missing appId');
    }

    const project = await this.getProject(appId);

    if (!project) {
      throw new UnauthorizedException('Invalid appId');
    }

    if (project.domainWhitelist?.length) {
      const origin = request.headers.origin || request.headers.referer || '';
      if (!this.isDomainAllowed(origin, project.domainWhitelist)) {
        throw new ForbiddenException('Domain not allowed');
      }
    }

    request.project = project;
    return true;
  }

  private async getProject(appId: string): Promise<Project | null> {
    const cached = this.cache.get(appId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.project;
    }

    const project = await this.projectRepository.findOne({ where: { appId } });

    if (project) {
      this.cache.set(appId, {
        project,
        expiresAt: Date.now() + this.cacheTTL,
      });
    }

    return project;
  }

  private isDomainAllowed(origin: string, whitelist: string[]): boolean {
    if (!origin) return false;

    let hostname: string;
    try {
      hostname = new URL(origin).hostname;
    } catch {
      return false;
    }

    return whitelist.some((pattern) => {
      if (pattern.startsWith('*.')) {
        const suffix = pattern.slice(1);
        return hostname.endsWith(suffix) || hostname === pattern.slice(2);
      }
      return hostname === pattern;
    });
  }
}
