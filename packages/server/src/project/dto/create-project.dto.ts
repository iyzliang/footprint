import { IsString, MaxLength, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'My Website' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: ['example.com', '*.example.com'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  domainWhitelist?: string[];
}
