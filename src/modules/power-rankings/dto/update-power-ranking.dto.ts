import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CreatePowerRankingDto } from './create-power-ranking.dto';
import { RankChangeDirection } from '../enums/power-ranking.enum';

export class RankedTeamDto {
  @ApiPropertyOptional({ example: '64abc123def459' })
  @IsOptional()
  @IsString()
  _id?: string;

  @ApiProperty({ example: 1, description: 'Rank position (1 = first)' })
  @IsInt()
  @Min(1)
  @Max(999)
  @Type(() => Number)
  rank!: number;

  @ApiPropertyOptional({ example: '64abc123def460' })
  @IsOptional()
  @IsMongoId()
  teamId?: string;

  @ApiProperty({ example: 'Lahore Lions' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  teamName!: string;

  @ApiPropertyOptional({ example: 'LLC' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  teamAbbreviation?: string;

  @ApiPropertyOptional({ example: 'https://cdn.nmsports.com/logos/llc.webp' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  teamLogo?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  previousRank?: number;

  @ApiPropertyOptional({
    enum: RankChangeDirection,
    example: RankChangeDirection.UP,
    description: 'up | down | same | new | dropped',
  })
  @IsOptional()
  @IsEnum(RankChangeDirection)
  changeDirection?: RankChangeDirection;

  @ApiPropertyOptional({ example: 2, description: 'How many positions moved' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  changeAmount?: number;

  @ApiPropertyOptional({ example: '12-3' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  record?: string;

  @ApiPropertyOptional({ example: 1450 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  points?: number;

  @ApiPropertyOptional({ example: 'Dominant defense, 5-game win streak' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePowerRankingDto extends PartialType(CreatePowerRankingDto) {
  @ApiPropertyOptional({
    type: [RankedTeamDto],
    description:
      'Full rankings array — add rows by appending, remove by setting isActive=false. ' +
      'Order by rank field. Ranks must be unique.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RankedTeamDto)
  rankings?: RankedTeamDto[];
}

export class AddRankingRowDto {
  @ApiProperty({ type: () => RankedTeamDto })
  @ValidateNested()
  @Type(() => RankedTeamDto)
  row!: RankedTeamDto;
}

export class ReorderRankingsDto {
  @ApiProperty({
    description: 'Array of row _ids in the new desired order (top to bottom)',
    example: ['64abc123def459', '64abc123def460', '64abc123def461'],
  })
  @IsArray()
  @IsString({ each: true })
  orderedIds!: string[];
}
