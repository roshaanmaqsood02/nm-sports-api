import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SportType } from '../../organizations/enums/organization.enum';
import {
  TournamentStatus,
  TournamentFormat,
  TournamentTeamStatus,
  TournamentVisibility,
  BracketRound,
  BracketMatchStatus,
} from '../enums/tournament.enum';

export class TournamentVenueDto {
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() address?: string;
  @ApiPropertyOptional() city?: string;
  @ApiPropertyOptional() country?: string;
}

export class TournamentPrizeDto {
  @ApiPropertyOptional() first?: string;
  @ApiPropertyOptional() second?: string;
  @ApiPropertyOptional() third?: string;
  @ApiPropertyOptional() description?: string;
}

export class TournamentContactDto {
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() email?: string;
  @ApiPropertyOptional() phone?: string;
}

export class TournamentTeamDto {
  @ApiProperty() _id!: string;
  @ApiProperty() teamId!: string;
  @ApiProperty() teamName!: string;
  @ApiPropertyOptional() teamAbbreviation?: string;
  @ApiPropertyOptional() seed?: number;
  @ApiPropertyOptional() group?: string;
  @ApiProperty({ enum: TournamentTeamStatus }) status!: TournamentTeamStatus;
  @ApiPropertyOptional() finalPlacement?: number;
  @ApiPropertyOptional() notes?: string;
}

export class TournamentResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() edition?: string;
  @ApiProperty() organizationId!: string;
  @ApiProperty({ enum: SportType }) sport!: SportType;
  @ApiProperty({ enum: TournamentFormat }) format!: TournamentFormat;
  @ApiProperty({ enum: TournamentVisibility })
  visibility!: TournamentVisibility;
  @ApiProperty() maxTeams!: number;
  @ApiProperty() registeredTeams!: number;
  @ApiProperty() availableSlots!: number;
  @ApiProperty() isFull!: boolean;
  @ApiProperty() isRegistrationOpen!: boolean;
  @ApiPropertyOptional() registrationStartDate?: Date;
  @ApiPropertyOptional() registrationEndDate?: Date;
  @ApiProperty() startDate!: Date;
  @ApiPropertyOptional() endDate?: Date;
  @ApiProperty({ type: () => TournamentVenueDto }) venue!: TournamentVenueDto;
  @ApiProperty({ type: () => TournamentPrizeDto }) prize!: TournamentPrizeDto;
  @ApiProperty({ type: () => TournamentContactDto })
  contact!: TournamentContactDto;
  @ApiPropertyOptional() rules?: string;
  @ApiProperty({ type: [TournamentTeamDto] }) teams!: TournamentTeamDto[];
  @ApiProperty({ enum: TournamentStatus }) status!: TournamentStatus;
  @ApiPropertyOptional() winnerId?: string;
  @ApiPropertyOptional() winnerName?: string;
  @ApiPropertyOptional() runnerUpId?: string;
  @ApiPropertyOptional() runnerUpName?: string;
  @ApiProperty() createdBy!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class BracketTeamEntryDto {
  @ApiPropertyOptional() teamId?: string;
  @ApiPropertyOptional() teamName?: string;
  @ApiPropertyOptional() teamAbbreviation?: string;
  @ApiProperty() score!: number;
  @ApiProperty() isWinner!: boolean;
  @ApiProperty() isBye!: boolean;
}

export class BracketResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() tournamentId!: string;
  @ApiProperty({ enum: BracketRound }) round!: BracketRound;
  @ApiPropertyOptional() roundLabel?: string;
  @ApiProperty() roundNumber!: number;
  @ApiProperty() matchNumber!: number;
  @ApiPropertyOptional() group?: string;
  @ApiProperty({ type: () => BracketTeamEntryDto }) teamA!: BracketTeamEntryDto;
  @ApiProperty({ type: () => BracketTeamEntryDto }) teamB!: BracketTeamEntryDto;
  @ApiPropertyOptional() winnerId?: string;
  @ApiPropertyOptional() winnerName?: string;
  @ApiPropertyOptional() matchId?: string;
  @ApiPropertyOptional() scheduledAt?: Date;
  @ApiPropertyOptional() nextMatchId?: string;
  @ApiPropertyOptional() loserNextMatchId?: string;
  @ApiProperty({ enum: BracketMatchStatus }) status!: BracketMatchStatus;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() createdAt!: Date;
}

export class TournamentStandingDto {
  @ApiProperty() _id!: string;
  @ApiProperty() tournamentId!: string;
  @ApiProperty() teamId!: string;
  @ApiProperty() teamName!: string;
  @ApiPropertyOptional() teamAbbreviation?: string;
  @ApiPropertyOptional() group?: string;
  @ApiProperty() position!: number;
  @ApiProperty() played!: number;
  @ApiProperty() won!: number;
  @ApiProperty() drawn!: number;
  @ApiProperty() lost!: number;
  @ApiProperty() points!: number;
  @ApiProperty() goalsFor!: number;
  @ApiProperty() goalsAgainst!: number;
  @ApiProperty() goalDifference!: number;
  @ApiProperty() winPercentage!: number;
  @ApiProperty() advanced!: boolean;
  @ApiProperty() eliminated!: boolean;
  @ApiProperty() form!: string[];
}

export class PaginatedTournamentsDto {
  @ApiProperty({ type: [TournamentResponseDto] })
  data!: TournamentResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}
