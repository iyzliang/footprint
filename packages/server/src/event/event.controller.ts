import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EventService } from './event.service';
import { QueryEventsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  @ApiOperation({ summary: 'Query events with pagination and filters' })
  findAll(@Query() query: QueryEventsDto) {
    return this.eventService.findAll(query);
  }

  @Get('names')
  @ApiOperation({ summary: 'Get distinct event names for a project' })
  getEventNames(@Query('projectId') projectId: string) {
    return this.eventService.getEventNames(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event details by ID' })
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }
}
