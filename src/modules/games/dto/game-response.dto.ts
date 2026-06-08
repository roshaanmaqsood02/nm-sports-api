import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GameStatus, GameType, GameVisibility } from '../enums/game.enum';

export class GameVenueResponseDto {
  @ApiProperty() name!: string;
  @ApiPropertyOptional() street?: string;
  @ApiPropertyOptional() city?: string;
  @ApiPropertyOptional() state?: string;
  @ApiPropertyOptional() country?: string;
  @ApiPropertyOptional() zip?: string;
  @ApiPropertyOptional() fullAddress?: string;
}

export class GameTimeResponseDto {
  @ApiProperty() startTime!: string;
  @ApiPropertyOptional() endTime?: string;
  @ApiProperty() timezone!: string;
  @ApiPropertyOptional() displayTime?: string;
  @ApiPropertyOptional() durationMinutes?: number;
  @ApiPropertyOptional() durationDisplay?: string;
}

export class GameOpponentResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() abbreviation?: string;
  @ApiPropertyOptional() logoUrl?: string;
  @ApiPropertyOptional() contactEmail?: string;
  @ApiPropertyOptional() contactPhone?: string;
  @ApiPropertyOptional() notes?: string;
}

export class GameResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() organizationId!: string;
  @ApiPropertyOptional() teamId?: string;
  @ApiPropertyOptional() teamName?: string;
  @ApiProperty() date!: Date;
  @ApiProperty({ type: () => GameTimeResponseDto }) time!: GameTimeResponseDto;
  @ApiProperty({ type: () => GameVenueResponseDto })
  venue!: GameVenueResponseDto;
  @ApiProperty({ enum: GameType }) gameType!: GameType;
  @ApiProperty({ type: [GameOpponentResponseDto] })
  opponents!: GameOpponentResponseDto[];
  @ApiProperty({ enum: GameStatus }) status!: GameStatus;
  @ApiProperty() homeScore!: number;
  @ApiProperty() awayScore!: number;
  @ApiPropertyOptional() arrivalTime?: string;
  @ApiPropertyOptional() uniformDetail?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty({ enum: GameVisibility }) visibility!: GameVisibility;
  @ApiPropertyOptional() season?: string;
  @ApiPropertyOptional() leagueName?: string;
  @ApiProperty() isUpcoming!: boolean;
  @ApiProperty() isPast!: boolean;
  @ApiProperty() opponentCount!: number;
  @ApiProperty() createdBy!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedGamesDto {
  @ApiProperty({ type: [GameResponseDto] }) data!: GameResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}
