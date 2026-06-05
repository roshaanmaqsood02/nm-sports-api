import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ArrayMinSize,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  SportType,
  OrganizationGender,
  OrgTimezone,
} from '../enums/organization.enum';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Lahore Lions Sports Club' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }) => value?.trim())
  name!: string;

  @ApiPropertyOptional({
    example: 'LLSC',
    description: 'Short acronym, max 8 uppercase characters',
  })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Acronym must be uppercase letters and numbers only',
  })
  @Transform(({ value }) => value?.toUpperCase().trim())
  acronym?: string;

  @ApiProperty({
    enum: SportType,
    isArray: true,
    example: [SportType.CRICKET, SportType.FOOTBALL],
    description: 'One or more sports this organization covers',
  })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.map((v: string) => v.trim());
    if (typeof value === 'string')
      return value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    return value;
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Select at least one sport' })
  @IsEnum(SportType, { each: true })
  sports!: SportType[];

  @ApiPropertyOptional({ example: 'contact@lahore-lions.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @ApiPropertyOptional({ example: '+923001234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'https://lahore-lions.com' })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid URL including https://' })
  website?: string;

  @ApiProperty({ example: '123 Main Street, Gulberg III' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  address!: string;

  @ApiProperty({ example: 'Lahore' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  city!: string;

  @ApiProperty({ example: 'Punjab' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  state!: string;

  @ApiProperty({ example: 'Pakistan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  country!: string;

  @ApiProperty({ example: '54000' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^[A-Z0-9\s-]+$/i, {
    message: 'Invalid zip/postal code format',
  })
  @Transform(({ value }) => value?.trim())
  zipCode!: string;

  @ApiPropertyOptional({
    enum: OrgTimezone,
    default: OrgTimezone.UTC,
  })
  @IsOptional()
  @IsEnum(OrgTimezone)
  timezone?: OrgTimezone;

  @ApiProperty({
    enum: OrganizationGender,
    example: OrganizationGender.MIXED,
  })
  @IsEnum(OrganizationGender)
  gender!: OrganizationGender;

  @ApiPropertyOptional({
    example: '#1A73E8',
    description: 'Brand/primary hex color code',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Color must be a valid hex code e.g. #FF5733',
  })
  color?: string;
}
