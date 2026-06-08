import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateGameDto, GameOpponentDto } from './create-game.dto';

export class UpdateGameDto extends PartialType(CreateGameDto) {}

export class AddOpponentDto {
  @ApiPropertyOptional({ type: () => GameOpponentDto })
  @ValidateNested()
  @Type(() => GameOpponentDto)
  opponent!: GameOpponentDto;
}

export class UpdateScoreDto {
  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  homeScore?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  awayScore?: number;
}
