import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SportType } from '../../organizations/enums/organization.enum';
import { TeamStatus, TeamGender, TeamType } from '../enums/team.enum';

export class TeamLogoDto {
  @ApiPropertyOptional() filename?: string;
  @ApiPropertyOptional() url?: string;
  @ApiPropertyOptional() size?: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;
}

export class TeamResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() shortName!: string;
  @ApiProperty() abbreviation!: string;
  @ApiProperty({ enum: SportType }) sport!: SportType;
  @ApiProperty({ enum: TeamGender }) gender!: TeamGender;
  @ApiProperty({ enum: TeamType }) type!: TeamType;
  @ApiProperty() season!: string;
  @ApiPropertyOptional() subSeason?: string;
  @ApiProperty() organizationId!: string;
  @ApiPropertyOptional() primaryColor?: string;
  @ApiPropertyOptional() secondaryColor?: string;
  @ApiPropertyOptional({ type: () => TeamLogoDto }) logo?: TeamLogoDto;
  @ApiProperty({ enum: TeamStatus }) status!: TeamStatus;
  @ApiProperty() createdBy!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedTeamsDto {
  @ApiProperty({ type: [TeamResponseDto] }) data!: TeamResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}
