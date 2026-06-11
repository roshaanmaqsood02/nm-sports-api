import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { DivisionType, DivisionStatus } from '../enums/division.enum';

export class QueryDivisionDto {
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

  @ApiPropertyOptional({ enum: DivisionType })
  @IsOptional()
  @IsEnum(DivisionType)
  type?: DivisionType;

  @ApiPropertyOptional({ enum: DivisionStatus })
  @IsOptional()
  @IsEnum(DivisionStatus)
  status?: DivisionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
