import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateClubDto } from './create-club.dto';
import { ClubStatus } from '../enums/club.enum';

export class UpdateClubDto extends PartialType(CreateClubDto) {
  @ApiPropertyOptional({ enum: ClubStatus })
  @IsOptional()
  @IsEnum(ClubStatus)
  status?: ClubStatus;
}
