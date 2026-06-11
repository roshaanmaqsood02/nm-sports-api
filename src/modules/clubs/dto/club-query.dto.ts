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
import { SportType } from '../../organizations/enums/organization.enum';
import { ClubGender, ClubStatus } from '../enums/club.enum';

export class QueryClubDto {
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

  @ApiPropertyOptional({ enum: SportType })
  @IsOptional()
  @IsEnum(SportType)
  sport?: SportType;

  @ApiPropertyOptional({ enum: ClubGender })
  @IsOptional()
  @IsEnum(ClubGender)
  gender?: ClubGender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  divisionId?: string;

  @ApiPropertyOptional({ enum: ClubStatus })
  @IsOptional()
  @IsEnum(ClubStatus)
  status?: ClubStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
