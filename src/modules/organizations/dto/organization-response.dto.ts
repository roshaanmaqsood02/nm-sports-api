import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SportType,
  OrganizationGender,
  OrganizationStatus,
  OrgTimezone,
} from '../enums/organization.enum';

export class OrgLogoDto {
  @ApiPropertyOptional() filename?: string;
  @ApiPropertyOptional() url?: string;
  @ApiPropertyOptional() size?: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;
}

export class OrgLocationDto {
  @ApiProperty() address!: string;
  @ApiProperty() city!: string;
  @ApiProperty() state!: string;
  @ApiProperty() country!: string;
  @ApiProperty() zipCode!: string;
}

export class OrgContactDto {
  @ApiPropertyOptional() email?: string;
  @ApiPropertyOptional() phone?: string;
  @ApiPropertyOptional() website?: string;
}

export class OrganizationResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() acronym?: string;

  @ApiProperty({ enum: SportType, isArray: true })
  sports!: SportType[];

  @ApiProperty({ type: () => OrgLocationDto })
  location!: OrgLocationDto;

  @ApiProperty({ type: () => OrgContactDto })
  contact!: OrgContactDto;

  @ApiProperty({ enum: OrgTimezone })
  timezone!: OrgTimezone;

  @ApiProperty({ enum: OrganizationGender })
  gender!: OrganizationGender;

  @ApiPropertyOptional() color?: string;

  @ApiPropertyOptional({ type: () => OrgLogoDto })
  logo?: OrgLogoDto;

  @ApiProperty({ enum: OrganizationStatus })
  status!: OrganizationStatus;

  @ApiProperty() memberCount!: number;
  @ApiProperty() createdBy!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedOrganizationsDto {
  @ApiProperty({ type: [OrganizationResponseDto] })
  data!: OrganizationResponseDto[];

  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}
