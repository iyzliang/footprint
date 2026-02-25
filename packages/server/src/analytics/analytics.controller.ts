import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import {
  TrendQueryDto,
  TopEventsQueryDto,
  FunnelQueryDto,
  WebVitalsQueryDto,
  PagePerformanceQueryDto,
  ErrorListQueryDto,
  ErrorDetailQueryDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('trend')
  @ApiOperation({ summary: 'Get event trend data by day/hour' })
  getTrend(@Query() query: TrendQueryDto) {
    return this.analyticsService.getTrend(query);
  }

  @Get('realtime')
  @ApiOperation({ summary: 'Get realtime stats (last 30 minutes)' })
  getRealtime(@Query('projectId') projectId: string) {
    return this.analyticsService.getRealtime(projectId);
  }

  @Get('top-events')
  @ApiOperation({ summary: 'Get top N events by count' })
  getTopEvents(@Query() query: TopEventsQueryDto) {
    return this.analyticsService.getTopEvents(query);
  }

  @Post('funnel')
  @ApiOperation({ summary: 'Funnel analysis with custom steps' })
  getFunnel(@Body() query: FunnelQueryDto) {
    return this.analyticsService.getFunnel(query);
  }

  @Get('web-vitals')
  @ApiOperation({ summary: 'Get Web Vitals metrics trend' })
  getWebVitals(@Query() query: WebVitalsQueryDto) {
    return this.analyticsService.getWebVitals(query);
  }

  @Get('page-performance')
  @ApiOperation({ summary: 'Get page performance ranking' })
  getPagePerformance(@Query() query: PagePerformanceQueryDto) {
    return this.analyticsService.getPagePerformance(query);
  }

  @Get('errors')
  @ApiOperation({ summary: 'Get aggregated error list' })
  getErrorList(@Query() query: ErrorListQueryDto) {
    return this.analyticsService.getErrorList(query);
  }

  @Get('errors/detail')
  @ApiOperation({ summary: 'Get error detail by message' })
  getErrorDetail(@Query() query: ErrorDetailQueryDto) {
    return this.analyticsService.getErrorDetail(query);
  }
}
