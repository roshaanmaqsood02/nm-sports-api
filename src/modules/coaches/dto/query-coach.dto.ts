import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CoachStatus, CoachRole } from '../enums/coach.enum';

export class QueryCoachDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by team' })
  @IsOptional()
  @IsMongoId()
  teamId?: string;

  @ApiPropertyOptional({ enum: CoachStatus })
  @IsOptional()
  @IsEnum(CoachStatus)
  status?: CoachStatus;

  @ApiPropertyOptional({ enum: CoachRole })
  @IsOptional()
  @IsEnum(CoachRole)
  coachRole?: CoachRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
