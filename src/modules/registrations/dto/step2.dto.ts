import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  WhoRegistering,
  ProcessingFeeResponsibility,
  PaymentTerm,
} from '../enums/registration.enum';

export class CustomPaymentTermDto {
  @ApiProperty({ example: 'Deposit' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  amount!: number;

  @ApiPropertyOptional({ example: '2025-10-01' })
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class Step2Dto {
  @ApiProperty({ example: 'Lahore Lions Sports Club' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  organizationName!: string;

  @ApiProperty({ example: 'https://kingdasports.com/lahore-lions' })
  @IsUrl()
  websiteUrl!: string;

  @ApiProperty({ example: 'Pakistan' })
  @IsString()
  @IsNotEmpty()
  country!: string;

  @ApiProperty({ example: 'Punjab' })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiProperty({ example: 'Fall 2025 Youth Basketball' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  registrationTitle!: string;

  @ApiProperty({
    enum: WhoRegistering,
    description:
      'parent_guardian_registering_child | person_registering_themselves | ' +
      'coach_team_manager_registering_team | other',
  })
  @IsEnum(WhoRegistering)
  whoRegistering!: WhoRegistering;

  @ApiPropertyOptional({ example: 'Club Administrator' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  otherWhoRegistering?: string;

  @ApiProperty({ example: 'Basketball' })
  @IsString()
  @IsNotEmpty()
  sport!: string;

  @ApiProperty({ example: 'League Registration' })
  @IsString()
  @IsNotEmpty()
  registrationType!: string;

  @ApiPropertyOptional({ example: 'Tournament Check-In' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  otherRegistrationType?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  addHeadsUpWaiver!: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  validateMembershipIds!: boolean;

  @ApiPropertyOptional({ example: 'standard_youth' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  registrationTemplate?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  collectDivisionsAgeGroups?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  collectAdditionalRequests?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  collectWaivers?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  collectHeadsUpWaiver?: boolean;

  @ApiPropertyOptional({
    example: 'Please list any allergies or medical conditions.',
    description: 'Additional questions (max 2000 chars)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  additionalQuestions?: string;

  @ApiPropertyOptional({
    example: 'U8 (2017-2018), U10 (2015-2016), U12 (2013-2014)',
    description: 'List your divisions/age groups (max 500 chars)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  divisionsAgeGroups?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  uploadSupportingDocs?: boolean;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  @Type(() => Number)
  supportingDocCount?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  limitRegistrations?: boolean;

  @ApiPropertyOptional({
    example: '8 Bantam teams, 12 PeeWee teams',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  inventoryRestrictions?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  needVolunteerBuyout?: boolean;

  @ApiPropertyOptional({
    example: '2 volunteer shifts required per family or $50 buyout',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  volunteerBuyoutRequirements?: string;

  @ApiProperty({
    enum: ProcessingFeeResponsibility,
    description: 'registrant_pays | organization_covers',
  })
  @IsEnum(ProcessingFeeResponsibility)
  processingFeeResponsibility!: ProcessingFeeResponsibility;

  @ApiProperty({
    example: 'U8: $150, U10: $175, U12: $200. Sibling discount: $25 off.',
    description: 'Total cost details (max 2000 chars)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  totalCostDetails!: string;

  @ApiProperty({
    enum: PaymentTerm,
    description: 'pay_in_full | custom_payment_terms',
  })
  @IsEnum(PaymentTerm)
  paymentTerm!: PaymentTerm;

  @ApiPropertyOptional({
    example: 2,
    description: 'Number of custom payment terms (1, 2, or 3)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  @Type(() => Number)
  customTermsCount?: number;

  @ApiPropertyOptional({
    type: [CustomPaymentTermDto],
    description: 'Custom payment term details',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomPaymentTermDto)
  customPaymentTerms?: CustomPaymentTermDto[];
}
