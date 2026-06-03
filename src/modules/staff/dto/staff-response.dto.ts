import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  StaffStatus,
  OrgAccessType,
  StaffResource,
  ResourcePermission,
} from '../enums/staff.enum';

export class ResourcePermissionResponseDto {
  @ApiProperty({ enum: StaffResource }) resource!: StaffResource;
  @ApiProperty() enabled!: boolean;
  @ApiProperty({ enum: ResourcePermission, isArray: true })
  permissions!: ResourcePermission[];
  @ApiProperty() resourceIds!: string[];
  @ApiProperty() resourceNames!: string[];
}

export class StaffInvitationDto {
  @ApiPropertyOptional() sentAt?: Date;
  @ApiPropertyOptional() expiresAt?: Date;
  @ApiPropertyOptional() acceptedAt?: Date;
  @ApiProperty() accepted!: boolean;
}

export class StaffResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty() email!: string;
  @ApiProperty() organizationId!: string;
  @ApiPropertyOptional() userId?: string;
  @ApiPropertyOptional() role?: string;
  @ApiProperty({ enum: OrgAccessType }) orgAccess!: OrgAccessType;
  @ApiProperty() hasOrgAccess!: boolean;
  @ApiProperty() isFullAccess!: boolean;
  @ApiProperty({ type: [ResourcePermissionResponseDto] })
  resourcePermissions!: ResourcePermissionResponseDto[];
  @ApiProperty({ type: () => StaffInvitationDto })
  invitation!: StaffInvitationDto;
  @ApiProperty({ enum: StaffStatus }) status!: StaffStatus;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() createdBy!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedStaffDto {
  @ApiProperty({ type: [StaffResponseDto] }) data!: StaffResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}
