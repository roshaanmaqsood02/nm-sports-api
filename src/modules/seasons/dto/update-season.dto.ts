import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateSeasonDto, CreateSubseasonDto } from './create-season.dto';
import { SeasonStatus, SubseasonStatus } from '../enums/season.enum';

export class UpdateSeasonDto extends PartialType(CreateSeasonDto) {
  @ApiPropertyOptional({ enum: SeasonStatus })
  @IsOptional()
  @IsEnum(SeasonStatus)
  status?: SeasonStatus;
}

export class UpdateSubseasonDto extends PartialType(CreateSubseasonDto) {
  @ApiPropertyOptional({ enum: SubseasonStatus })
  @IsOptional()
  @IsEnum(SubseasonStatus)
  status?: SubseasonStatus;
}

export class GenerateSeedsDto {
  @ApiPropertyOptional({
    example: 8,
    description:
      'Number of seeds to generate (defaults to subseason seedCount)',
  })
  @IsOptional()
  seedCount?: number;

  @ApiPropertyOptional({
    example: ['64abc123def457', '64abc123def458'],
    description: 'Optional ordered team IDs to assign seeds to',
  })
  @IsOptional()
  teamIds?: string[];
}

export class GenerateGameIdsDto {
  @ApiPropertyOptional({
    example: 'SPR25-',
    description: 'Prefix override for this generation run',
  })
  @IsOptional()
  prefix?: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of game IDs to pre-generate',
  })
  @IsOptional()
  count?: number;
}
