import { IsString, IsArray, IsDateString, IsEnum, IsOptional, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FunnelGroupBy {
  USER = 'userId',
  SESSION = 'sessionId',
}

export class FunnelQueryDto {
  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiProperty({ type: [String], example: ['page_view', 'add_to_cart', 'purchase'] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(2)
  steps: string[];

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-01-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ enum: FunnelGroupBy, default: FunnelGroupBy.USER })
  @IsOptional()
  @IsEnum(FunnelGroupBy)
  groupBy?: FunnelGroupBy = FunnelGroupBy.USER;
}
