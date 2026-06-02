import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateDivisionDto } from './create-division.dto';
import { DivisionStatus } from '../enums/division.enum';

export class UpdateDivisionDto extends PartialType(CreateDivisionDto) {
  @ApiPropertyOptional({ enum: DivisionStatus })
  @IsOptional()
  @IsEnum(DivisionStatus)
  status?: DivisionStatus;
}
