import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SportType } from '../../organizations/enums/organization.enum';
import { ClubGender, ClubStatus } from '../enums/club.enum';

export class ClubResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() shortName!: string;
  @ApiProperty() abbreviation!: string;
  @ApiProperty({ enum: ClubGender }) gender!: ClubGender;
  @ApiProperty({ enum: SportType }) sport!: SportType;
  @ApiProperty() organizationId!: string;
  @ApiPropertyOptional() divisionId?: string;
  @ApiPropertyOptional() primaryColor?: string;
  @ApiPropertyOptional() secondaryColor?: string;
  @ApiProperty({ enum: ClubStatus }) status!: ClubStatus;
  @ApiProperty() createdBy!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedClubsDto {
  @ApiProperty({ type: [ClubResponseDto] }) data!: ClubResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}
