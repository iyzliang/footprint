import { IsString, IsDateString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Granularity } from './trend-query.dto';

export class WebVitalsQueryDto {
  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-01-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ enum: Granularity, default: Granularity.DAY })
  @IsOptional()
  @IsEnum(Granularity)
  granularity?: Granularity = Granularity.DAY;
}

export class PagePerformanceQueryDto {
  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-01-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
