import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProduces } from '@nestjs/swagger';
import { Response } from 'express';
import { EventService } from './event.service';
import { QueryEventsDto, ExportEventsDto } from './dto';
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

  @Get('export')
  @ApiOperation({ summary: 'Export events as CSV file' })
  @ApiProduces('text/csv')
  exportCsv(@Query() query: ExportEventsDto, @Res() res: Response) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `events-export-${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const stream = this.eventService.createExportStream(query);

    stream.on('error', () => {
      if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to export events' });
      }
    });

    stream.pipe(res);
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
