import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class Step5Dto {
  @ApiPropertyOptional({
    example: 100,
    description: 'Rush fee amount ($100 if rush timeline selected)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rushFeeAmount?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalAmount?: number;

  @ApiPropertyOptional({ example: 'Payment pending — invoice will be sent.' })
  @IsOptional()
  @IsString()
  paymentNotes?: string;

  // NOTE: No payment gateway implemented yet
  // paymentCompleted will be set to false by default
  // Admin will manually mark as paid or invoice will be sent
}
