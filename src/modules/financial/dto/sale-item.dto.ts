import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { SaleItemPriceOption } from '../enums/financial.enum';

export class SaleItemVariationDto {
  @ApiProperty({ example: 'U10 Division' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priceAdjustment?: number;

  @ApiPropertyOptional({ example: 'SKU-U10-001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sku?: string;

  @ApiPropertyOptional({ example: 0, description: 'Number of units sold' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  sold?: number; // Add this field

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateSaleItemDto {
  @ApiProperty({ example: '64abc123def456' })
  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @ApiProperty({ example: '2024 Fall Basketball Registration' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  name!: string;

  @ApiPropertyOptional({ example: 'Annual basketball league registration fee' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 175.0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price!: number;

  @ApiProperty({
    enum: SaleItemPriceOption,
    default: SaleItemPriceOption.FULL_PRICE_UP_FRONT,
    description:
      'full_price_due_upfront | partial_amount_due_upfront | nothing_due_upfront',
  })
  @IsEnum(SaleItemPriceOption)
  priceOption!: SaleItemPriceOption;

  @ApiPropertyOptional({
    example: 50.0,
    description: 'Required when priceOption = partial_amount_due_upfront',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  upfrontAmount?: number;

  @ApiPropertyOptional({ example: 'SKU-BBALL-2024' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sku?: string;

  @ApiPropertyOptional({ type: [SaleItemVariationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemVariationDto)
  variations?: SaleItemVariationDto[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hasInventoryLimit?: boolean;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  inventoryLimit?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSaleItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;
  @ApiPropertyOptional({ enum: SaleItemPriceOption })
  @IsOptional()
  @IsEnum(SaleItemPriceOption)
  priceOption?: SaleItemPriceOption;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  upfrontAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) sku?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasInventoryLimit?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  inventoryLimit?: number;

  @ApiPropertyOptional({ type: [SaleItemVariationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemVariationDto)
  variations?: SaleItemVariationDto[];
}
