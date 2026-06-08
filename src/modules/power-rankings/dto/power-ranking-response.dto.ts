import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PowerRankingStatus,
  RankChangeDirection,
} from '../enums/power-ranking.enum';

export class RankedTeamResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() rank!: number;
  @ApiPropertyOptional() teamId?: string;
  @ApiProperty() teamName!: string;
  @ApiPropertyOptional() teamAbbreviation?: string;
  @ApiPropertyOptional() teamLogo?: string;
  @ApiPropertyOptional() previousRank?: number;
  @ApiProperty({ enum: RankChangeDirection })
  changeDirection!: RankChangeDirection;
  @ApiProperty() changeAmount!: number;
  @ApiPropertyOptional() record?: string;
  @ApiProperty() points!: number;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() isActive!: boolean;
}

export class PowerRankingResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() label!: string;
  @ApiProperty() organizationId!: string;
  @ApiPropertyOptional() leagueId?: string;
  @ApiPropertyOptional() leagueName?: string;
  @ApiPropertyOptional() subseasonId?: string;
  @ApiPropertyOptional() subseasonName?: string;
  @ApiProperty({ type: [RankedTeamResponseDto] })
  rankings!: RankedTeamResponseDto[];
  @ApiProperty() totalTeams!: number;
  @ApiProperty({ enum: PowerRankingStatus }) status!: PowerRankingStatus;
  @ApiPropertyOptional() publishedAt?: Date;
  @ApiProperty() createdBy!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedPowerRankingsDto {
  @ApiProperty({ type: [PowerRankingResponseDto] })
  data!: PowerRankingResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}
