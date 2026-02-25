import { Controller, Post, Body, UseGuards, Request, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CollectService } from './collect.service';
import { CollectEventDto } from './dto';
import { AppIdGuard } from './guards/app-id.guard';
import { Project } from '../entities';

@ApiTags('Collect')
@Controller('api/collect')
export class CollectController {
  constructor(private readonly collectService: CollectService) {}

  @Post()
  @UseGuards(AppIdGuard)
  @ApiOperation({ summary: 'Collect events from SDK' })
  collect(@Body() dto: CollectEventDto, @Request() req: { project: Project }, @Ip() ip: string) {
    return this.collectService.collect(dto.events, req.project, ip);
  }
}
