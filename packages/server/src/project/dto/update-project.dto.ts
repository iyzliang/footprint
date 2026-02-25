import { IsString, MaxLength, IsOptional, IsArray, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'My Website v2' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: ['example.com'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  domainWhitelist?: string[];

  @ApiPropertyOptional({ example: 90 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3650)
  dataRetentionDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  settings?: Record<string, unknown>;
}
