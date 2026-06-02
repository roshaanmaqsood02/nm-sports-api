import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TournamentTeamStatus } from '../enums/tournament.enum';

export class RegisterTeamDto {
  @ApiProperty({ example: '64abc123def457' })
  @IsMongoId()
  @IsNotEmpty()
  teamId!: string;

  @ApiProperty({ example: 'Lahore Lions' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  teamName!: string;

  @ApiPropertyOptional({ example: 'LLC' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  teamAbbreviation?: string;

  @ApiPropertyOptional({ example: 1, description: 'Seeding (1 = top seed)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  seed?: number;

  @ApiPropertyOptional({ example: 'A', description: 'Group assignment' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  group?: string;

  @ApiPropertyOptional({ example: 'Defending champions' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

export class UpdateTeamRegistrationDto {
  @ApiPropertyOptional({ enum: TournamentTeamStatus })
  @IsOptional()
  @IsEnum(TournamentTeamStatus)
  status?: TournamentTeamStatus;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  seed?: number;

  @ApiPropertyOptional({ example: 'B' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  group?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  finalPlacement?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

export class AssignGroupsDto {
  @ApiProperty({
    example: [
      { teamId: '64abc123def457', group: 'A' },
      { teamId: '64abc123def458', group: 'B' },
    ],
  })
  assignments!: { teamId: string; group: string }[];
}
