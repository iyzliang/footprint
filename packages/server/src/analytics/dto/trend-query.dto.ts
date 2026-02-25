import { IsString, IsArray, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Granularity {
  HOUR = 'hour',
  DAY = 'day',
}

export class TrendQueryDto {
  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiProperty({ type: [String], example: ['page_view', 'click'] })
  @IsArray()
  @IsString({ each: true })
  eventNames: string[];

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
