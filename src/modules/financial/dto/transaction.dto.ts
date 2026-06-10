import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  TransactionType,
  TransactionStatus,
  PaymentType,
} from '../enums/financial.enum';

export class CreateTransactionDto {
  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @ApiPropertyOptional({ example: '64abc123def457' })
  @IsOptional()
  @IsMongoId()
  invoiceId?: string;

  @ApiPropertyOptional({ example: 'INV-2024-00001' })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional({ example: 'WOKL16265' })
  @IsOptional()
  @IsString()
  saleNumber?: string;

  @ApiProperty({ example: '2024 Fall Basketball — Installment 1 of 3' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string;

  @ApiPropertyOptional({ example: '64abc123def458' })
  @IsOptional()
  @IsMongoId()
  paidById?: string;

  @ApiPropertyOptional({ example: 'Carl Williamson' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  paidByName?: string;

  @ApiPropertyOptional({ example: 'carl@example.com' })
  @IsOptional()
  @IsString()
  paidByEmail?: string;

  @ApiProperty({
    enum: PaymentType,
    description:
      'credit_card | debit_card | bank_transfer | cash | check | online | other',
  })
  @IsEnum(PaymentType)
  paymentType!: PaymentType;

  @ApiPropertyOptional({
    example: 'xxxx-4242',
    description: 'Last 4 of card, check number, or bank ref',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  paymentIdentifier?: string;

  @ApiProperty({ example: 175.0 })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount!: number;

  @ApiPropertyOptional({ example: 2.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  feeAmount?: number;

  @ApiProperty({ enum: TransactionType, default: TransactionType.PAYMENT })
  @IsEnum(TransactionType)
  type!: TransactionType;

  @ApiPropertyOptional({
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiProperty({ example: '2024-09-01' })
  @IsDateString()
  transactionDate!: string;

  @ApiPropertyOptional({ example: 'First installment received via card.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  installmentNumber?: number;
}

export class UpdateTransactionDto {
  @ApiPropertyOptional({ enum: TransactionStatus })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
