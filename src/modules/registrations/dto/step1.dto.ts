import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CompletionTimeline,
  SessionType,
  SignupType,
} from '../enums/registration.enum';

export class Step1Dto {
  @ApiProperty({
    example: true,
    description:
      'Has your organization used Kingda Sports Registration before?',
  })
  @IsBoolean()
  usedBefore!: boolean;

  @ApiProperty({
    enum: SessionType,
    description: 'new_registration_session | copy_existing_session',
  })
  @IsEnum(SessionType)
  sessionType!: SessionType;

  @ApiProperty({
    enum: CompletionTimeline,
    description: 'standard_5_business_days | rush_2_business_days',
  })
  @IsEnum(CompletionTimeline)
  completionTimeline!: CompletionTimeline;

  @ApiProperty({
    example: '2025-09-05',
    description:
      'Expected completion date (displayed to user as Sep 05, 2025 by 7pm CST)',
  })
  @IsDateString()
  expectedCompletionDate!: string;

  @ApiPropertyOptional({ example: 'Fall 2025 Registration' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  newRegistrationTitle?: string;

  @ApiPropertyOptional({ example: 'Lahore Lions Sports Club' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  organizationName?: string;

  @ApiPropertyOptional({ example: 'Basketball' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sport?: string;

  @ApiPropertyOptional({ enum: SignupType })
  @IsOptional()
  @IsEnum(SignupType)
  signupType?: SignupType;

  @ApiPropertyOptional({
    example: 'https://kingdasports.com/register/fall2024',
    description: 'URL of existing registration to copy',
  })
  @IsOptional()
  @IsUrl()
  copySourceUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  copyToSameWebsite?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  needChanges?: boolean;

  @ApiPropertyOptional({
    example: 'Update team fee from $150 to $175',
    description: 'List changes needed (max 5000 chars)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  changesNeeded?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  collectingMoney?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  limitRegistrations?: boolean;

  @ApiPropertyOptional({
    example: '8 Bantam teams, 12 PeeWee teams',
    description: 'Inventory restrictions (max 500 chars)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  inventoryRestrictions?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  uploadDocumentation?: boolean;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  @Type(() => Number)
  documentCount?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  includesBackgroundScreen?: boolean;
}
