import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  OrgAccessType,
  StaffResource,
  ResourcePermission,
} from '../enums/staff.enum';

export class ResourcePermissionDto {
  @ApiProperty({
    enum: StaffResource,
    example: StaffResource.TEAMS,
    description: 'Resource: organization | teams | players | leagues',
  })
  @IsEnum(StaffResource)
  resource!: StaffResource;

  @ApiProperty({
    example: true,
    description: 'Enable or disable access to this resource',
  })
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({
    enum: ResourcePermission,
    isArray: true,
    example: [ResourcePermission.VIEW, ResourcePermission.EDIT],
    description:
      'Permissions for this resource: view | create | edit | delete | manage',
  })
  @IsArray()
  @IsEnum(ResourcePermission, { each: true })
  permissions!: ResourcePermission[];

  @ApiPropertyOptional({
    example: ['64abc123def456', '64abc123def457'],
    description:
      'Optional: restrict to specific resource IDs e.g. only these team IDs',
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  resourceIds?: string[];

  @ApiPropertyOptional({
    example: ['Lahore Lions', 'Karachi Kings'],
    description: 'Display names for resourceIds',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resourceNames?: string[];
}

export class CreateStaffDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(60)
  @Transform(({ value }) => value?.trim())
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(60)
  @Transform(({ value }) => value?.trim())
  lastName!: string;

  @ApiProperty({ example: 'john.doe@nmsports.com' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @ApiPropertyOptional({
    example: 'Head Coach',
    description: 'Optional job title / role label',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  role?: string;

  @ApiProperty({
    enum: OrgAccessType,
    example: OrgAccessType.LIMITED,
    description:
      'no_access → No access | full_access → Full Access | limited_access → Limited Access',
  })
  @IsEnum(OrgAccessType)
  orgAccess!: OrgAccessType;

  @ApiPropertyOptional({
    type: [ResourcePermissionDto],
    description:
      'Resource-level permissions (only used when orgAccess = limited_access). ' +
      'Provide one entry per resource you want to configure: ' +
      'organization, teams, players, leagues',
    example: [
      {
        resource: 'teams',
        enabled: true,
        permissions: ['view', 'create', 'edit'],
        resourceIds: [],
        resourceNames: [],
      },
      {
        resource: 'players',
        enabled: true,
        permissions: ['view'],
        resourceIds: [],
        resourceNames: [],
      },
      {
        resource: 'leagues',
        enabled: false,
        permissions: [],
        resourceIds: [],
        resourceNames: [],
      },
      {
        resource: 'organization',
        enabled: false,
        permissions: [],
        resourceIds: [],
        resourceNames: [],
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResourcePermissionDto)
  resourcePermissions?: ResourcePermissionDto[];

  @ApiPropertyOptional({ example: 'Manages the U21 team operations' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
