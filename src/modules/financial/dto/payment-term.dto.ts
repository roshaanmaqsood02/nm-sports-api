import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { InstallmentWindow, PaymentTermStatus } from '../enums/financial.enum';

export class InstallmentDefinitionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  installmentNumber!: number;

  @ApiPropertyOptional({
    example: 33.33,
    description: '% of total for this installment',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  percentage?: number;

  @ApiPropertyOptional({
    example: 100.0,
    description: 'Fixed amount (alternative to %)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  fixedAmount?: number;

  @ApiPropertyOptional({ example: 'Deposit' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;

  @ApiPropertyOptional({ example: '2024-10-01' })
  @IsOptional()
  @IsDateString()
  specificDate?: string;
}

export class CreatePaymentTermDto {
  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @ApiProperty({ example: 'Fall 2024 — 3-Payment Plan' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  @Transform(({ value }) => value?.trim())
  name!: string;

  @ApiPropertyOptional({ example: 'Three equal installments over 90 days' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: '2024-08-01', description: 'Term active from date' })
  @IsDateString()
  activeFrom!: string;

  @ApiPropertyOptional({
    example: '2024-12-31',
    description: 'Term active to date',
  })
  @IsOptional()
  @IsDateString()
  activeTo?: string;

  @ApiProperty({ example: 3, description: 'Number of installments' })
  @IsInt()
  @Min(1)
  @Max(24)
  @Type(() => Number)
  installmentCount!: number;

  @ApiProperty({
    enum: InstallmentWindow,
    description: 'every_30_days | first_day_of_each_month | specific_date',
  })
  @IsEnum(InstallmentWindow)
  installmentWindow!: InstallmentWindow;

  @ApiPropertyOptional({
    example: 1,
    description: 'Day of month (for first_day_of_each_month or specific_date)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  @Type(() => Number)
  specificDayOfMonth?: number;

  @ApiPropertyOptional({
    example: '2024-10-14',
    description: 'Specific payment date (for specific_date window)',
  })
  @IsOptional()
  @IsDateString()
  specificDate?: string;

  @ApiPropertyOptional({ type: [InstallmentDefinitionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstallmentDefinitionDto)
  installments?: InstallmentDefinitionDto[];

  @ApiPropertyOptional({ example: ['64abc123def457', '64abc123def458'] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  appliedToSaleItems?: string[];

  @ApiPropertyOptional({
    example: ['Basketball Registration', 'Soccer Registration'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  appliedToSaleItemNames?: string[];

  @ApiPropertyOptional({
    enum: PaymentTermStatus,
    default: PaymentTermStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(PaymentTermStatus)
  status?: PaymentTermStatus;
}

export class UpdatePaymentTermDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() activeFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() activeTo?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  @Type(() => Number)
  installmentCount?: number;
  @ApiPropertyOptional({ enum: InstallmentWindow })
  @IsOptional()
  @IsEnum(InstallmentWindow)
  installmentWindow?: InstallmentWindow;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  @Type(() => Number)
  specificDayOfMonth?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() specificDate?: string;
  @ApiPropertyOptional({ enum: PaymentTermStatus })
  @IsOptional()
  @IsEnum(PaymentTermStatus)
  status?: PaymentTermStatus;

  @ApiPropertyOptional({ type: [InstallmentDefinitionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstallmentDefinitionDto)
  installments?: InstallmentDefinitionDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  appliedToSaleItems?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  appliedToSaleItemNames?: string[];
}
