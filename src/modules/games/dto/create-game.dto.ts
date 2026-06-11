import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { GameStatus, GameType, GameVisibility } from '../enums/game.enum';

export class GameVenueDto {
  @ApiProperty({ example: 'Sinclair Community College' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ example: 'West Third Street' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  street?: string;

  @ApiPropertyOptional({ example: 'Dayton' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'OH' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  state?: string;

  @ApiPropertyOptional({ example: 'USA' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ example: '45402' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zip?: string;

  @ApiPropertyOptional({
    example: 'Sinclair Community College, West Third Street, Dayton, OH, USA',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fullAddress?: string;
}

export class GameTimeDto {
  @ApiProperty({
    example: '3:00 PM',
    description: 'Start time e.g. "3:00 PM"',
  })
  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @ApiPropertyOptional({
    example: '5:00 PM',
    description: 'End time e.g. "5:00 PM"',
  })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({
    example: 'EDT',
    description: 'Timezone abbreviation or IANA e.g. EDT, America/New_York',
  })
  @IsString()
  @IsNotEmpty()
  timezone!: string;

  @ApiPropertyOptional({
    example: '3:00 PM - 5:00 PM EDT',
    description: 'Full display string',
  })
  @IsOptional()
  @IsString()
  displayTime?: string;

  @ApiPropertyOptional({
    example: 120,
    description: 'Duration in minutes',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: '2 hours' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  durationDisplay?: string;
}

export class GameOpponentDto {
  @ApiProperty({ example: 'Karachi Kings' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'KK' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  abbreviation?: string;

  @ApiPropertyOptional({ example: 'https://cdn.nmsports.com/kk.webp' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'manager@karachiKings.com' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+923001234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'Strong offense' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

export class CreateGameDto {
  @ApiProperty({ example: 'Spring Championship — Game 5' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  name!: string;

  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @ApiPropertyOptional({ example: '64abc123def457' })
  @IsOptional()
  @IsMongoId()
  teamId?: string;

  @ApiPropertyOptional({ example: 'Lahore Lions' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  teamName?: string;

  @ApiProperty({ example: '2025-04-15', description: 'Game date (YYYY-MM-DD)' })
  @IsDateString()
  date!: string;

  @ApiProperty({ type: () => GameTimeDto })
  @ValidateNested()
  @Type(() => GameTimeDto)
  time!: GameTimeDto;

  @ApiProperty({ type: () => GameVenueDto })
  @ValidateNested()
  @Type(() => GameVenueDto)
  venue!: GameVenueDto;

  @ApiPropertyOptional({ enum: GameType, default: GameType.HOME })
  @IsOptional()
  @IsEnum(GameType)
  gameType?: GameType;

  @ApiPropertyOptional({
    type: [GameOpponentDto],
    description: 'Add one or more opponents',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GameOpponentDto)
  opponents?: GameOpponentDto[];

  @ApiPropertyOptional({
    enum: GameStatus,
    default: GameStatus.SCHEDULED,
    description:
      'scheduled | in_progress | completed | cancelled | postponed | forfeited',
  })
  @IsOptional()
  @IsEnum(GameStatus)
  status?: GameStatus;

  @ApiPropertyOptional({
    example: '2:30 PM',
    description: 'Arrival time (optional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  arrivalTime?: string;

  @ApiPropertyOptional({
    example: 'White jersey, black shorts, white socks',
    description: 'Uniform detail (optional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  uniformDetail?: string;

  @ApiPropertyOptional({
    example: 'Bring extra water. Warm up at 2:45 PM.',
    description: 'Notes (optional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ example: '2024-25' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  season?: string;

  @ApiPropertyOptional({ example: '64abc123def458' })
  @IsOptional()
  @IsMongoId()
  leagueId?: string;

  @ApiPropertyOptional({ example: 'NMSports Basketball League' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  leagueName?: string;

  @ApiPropertyOptional({ enum: GameVisibility, default: GameVisibility.TEAM })
  @IsOptional()
  @IsEnum(GameVisibility)
  visibility?: GameVisibility;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  homeScore?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  awayScore?: number;
}
