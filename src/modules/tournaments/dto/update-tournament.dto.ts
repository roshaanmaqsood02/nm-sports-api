import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CreateTournamentDto } from './create-tournament.dto';
import { TournamentStatus } from '../enums/tournament.enum';

export class UpdateTournamentDto extends PartialType(CreateTournamentDto) {
  @ApiPropertyOptional({ enum: TournamentStatus })
  @IsOptional()
  @IsEnum(TournamentStatus)
  status?: TournamentStatus;

  @ApiPropertyOptional({ example: '64abc123def456' })
  @IsOptional()
  @IsMongoId()
  winnerId?: string;

  @ApiPropertyOptional({ example: 'Lahore Lions' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  winnerName?: string;

  @ApiPropertyOptional({ example: '64abc123def457' })
  @IsOptional()
  @IsMongoId()
  runnerUpId?: string;

  @ApiPropertyOptional({ example: 'Karachi Kings' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  runnerUpName?: string;
}
