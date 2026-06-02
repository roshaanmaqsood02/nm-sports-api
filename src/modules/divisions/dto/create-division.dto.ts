import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { DivisionType } from '../enums/division.enum';

export class CreateDivisionDto {
  @ApiProperty({ example: 'Eastern Conference' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }) => value?.trim())
  name!: string;

  @ApiProperty({ example: 'East Conf' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(60)
  @Transform(({ value }) => value?.trim())
  shortName!: string;

  @ApiProperty({ example: 'EC', description: 'Max 8 uppercase alphanumeric' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Abbreviation must be uppercase letters and numbers only',
  })
  @Transform(({ value }) => value?.toUpperCase().trim())
  abbreviation!: string;

  @ApiProperty({ enum: DivisionType, example: DivisionType.CLUB })
  @IsEnum(DivisionType)
  type!: DivisionType;

  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @ApiPropertyOptional({ example: '#1A73E8' })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'primaryColor must be a valid hex code',
  })
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#FFFFFF' })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'secondaryColor must be a valid hex code',
  })
  secondaryColor?: string;
}
