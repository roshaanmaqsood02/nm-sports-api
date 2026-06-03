import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateStaffDto, ResourcePermissionDto } from './create-staff.dto';
import { StaffStatus, OrgAccessType } from '../enums/staff.enum';

export class UpdateStaffDto extends PartialType(CreateStaffDto) {
  @ApiPropertyOptional({ enum: StaffStatus })
  @IsOptional()
  @IsEnum(StaffStatus)
  status?: StaffStatus;
}

// ─── Update resource permissions only ────────────────────────────────────────
export class UpdatePermissionsDto {
  @ApiPropertyOptional({
    enum: OrgAccessType,
    description: 'Change access level',
  })
  @IsOptional()
  @IsEnum(OrgAccessType)
  orgAccess?: OrgAccessType;

  @ApiPropertyOptional({
    type: [ResourcePermissionDto],
    description: 'Replace full resourcePermissions array',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResourcePermissionDto)
  resourcePermissions?: ResourcePermissionDto[];
}

// ─── Resend invitation ────────────────────────────────────────────────────────
export class ResendInvitationDto {
  @ApiPropertyOptional({
    example: '64abc123def456',
    description: 'Staff member ID to resend invitation to',
  })
  @IsMongoId()
  staffId!: string;
}

// ─── Accept invitation ────────────────────────────────────────────────────────
export class AcceptInvitationDto {
  @ApiPropertyOptional({ example: 'abc123token' })
  @IsString()
  token!: string;

  @ApiPropertyOptional({
    example: '64abc123def456',
    description: 'User ID of the accepting user',
  })
  @IsMongoId()
  userId!: string;
}
