import {
  IsString,
  IsNumber,
  IsOptional,
  IsObject,
  MaxLength,
  IsArray,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EventItemDto {
  @ApiProperty({ example: 'page_view' })
  @IsString()
  @MaxLength(200)
  eventName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  @ApiProperty({ example: 1700000000000 })
  @IsNumber()
  timestamp: number;

  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty()
  @IsString()
  anonymousId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pageTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referrer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  screenResolution?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;
}

export class CollectEventDto {
  @ApiProperty()
  @IsString()
  appId: string;

  @ApiProperty({ type: [EventItemDto] })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => EventItemDto)
  events: EventItemDto[];
}
