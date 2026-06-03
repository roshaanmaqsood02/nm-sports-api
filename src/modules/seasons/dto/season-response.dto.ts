import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SeasonType,
  SeasonStatus,
  DataSourceType,
  GameIdGeneration,
  StaticGroupingType,
  SubseasonStatus,
} from '../enums/season.enum';

export class SeedConfigDto {
  @ApiProperty() enabled!: boolean;
  @ApiProperty() autoGenerate!: boolean;
  @ApiProperty() seedCount!: number;
  @ApiPropertyOptional() seedRules?: string;
}

export class CopySubseasonConfigDto {
  @ApiPropertyOptional() sourceSubseasonId?: string;
  @ApiPropertyOptional() sourceSubseasonName?: string;
  @ApiPropertyOptional() topDivisionPageSource?: string;
  @ApiPropertyOptional() bottomDivisionPageSource?: string;
  @ApiPropertyOptional() topTeamPageSource?: string;
  @ApiPropertyOptional() bottomTeamPageSource?: string;
}

export class SubseasonResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() shortName?: string;
  @ApiProperty() order!: number;
  @ApiProperty({ enum: DataSourceType }) dataSource!: DataSourceType;
  @ApiProperty({ type: () => CopySubseasonConfigDto })
  copyConfig!: CopySubseasonConfigDto;
  @ApiProperty({ enum: GameIdGeneration }) gameIdGeneration!: GameIdGeneration;
  @ApiPropertyOptional() gameIdPrefix?: string;
  @ApiProperty() gameIdCounter!: number;
  @ApiProperty({ type: () => SeedConfigDto }) seedConfig!: SeedConfigDto;
  @ApiProperty() gameTypeTitle!: string;
  @ApiProperty() groupNameTitle!: string;
  @ApiProperty({ enum: StaticGroupingType })
  staticGrouping!: StaticGroupingType;
  @ApiProperty() customGroups!: string[];
  @ApiPropertyOptional() startDate?: Date;
  @ApiPropertyOptional() endDate?: Date;
  @ApiProperty({ enum: SubseasonStatus }) status!: SubseasonStatus;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() createdAt!: Date;
}

export class SeasonResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() organizationId!: string;
  @ApiProperty({ enum: SeasonType }) type!: SeasonType;
  @ApiPropertyOptional() clubOrLeagueId?: string;
  @ApiPropertyOptional() clubOrLeagueName?: string;
  @ApiProperty({ enum: StaticGroupingType })
  staticGrouping!: StaticGroupingType;
  @ApiProperty({ type: [SubseasonResponseDto] })
  subseasons!: SubseasonResponseDto[];
  @ApiProperty() subseasonCount!: number;
  @ApiPropertyOptional() activeSubseason?: SubseasonResponseDto;
  @ApiPropertyOptional() startDate?: Date;
  @ApiPropertyOptional() endDate?: Date;
  @ApiProperty({ enum: SeasonStatus }) status!: SeasonStatus;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() createdBy!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedSeasonsDto {
  @ApiProperty({ type: [SeasonResponseDto] }) data!: SeasonResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}

export class GeneratedGameIdsDto {
  @ApiProperty() subseasonId!: string;
  @ApiProperty() prefix!: string;
  @ApiProperty() generated!: number;
  @ApiProperty() startFrom!: number;
  @ApiProperty({ type: [String] }) gameIds!: string[];
}

export class GeneratedSeedsDto {
  @ApiProperty() subseasonId!: string;
  @ApiProperty() seedCount!: number;
  @ApiProperty({ type: [Object] })
  seeds!: { seed: number; teamId?: string; teamName?: string }[];
}
