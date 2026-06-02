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
import { SportType } from '../../organizations/enums/organization.enum';
import { ClubGender } from '../enums/club.enum';

export class CreateClubDto {
  @ApiProperty({ example: 'Lahore Lions Basketball Club' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }) => value?.trim())
  name!: string;

  @ApiProperty({ example: 'Lahore Lions' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(60)
  @Transform(({ value }) => value?.trim())
  shortName!: string;

  @ApiProperty({ example: 'LLC', description: 'Max 8 uppercase alphanumeric' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Abbreviation must be uppercase letters and numbers only',
  })
  @Transform(({ value }) => value?.toUpperCase().trim())
  abbreviation!: string;

  @ApiProperty({ enum: ClubGender, example: ClubGender.MIXED })
  @IsEnum(ClubGender)
  gender!: ClubGender;

  @ApiProperty({ enum: SportType, example: SportType.BASKETBALL })
  @IsEnum(SportType)
  sport!: SportType;

  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @ApiPropertyOptional({
    example: '64abc123def457',
    description: 'Optional parent division',
  })
  @IsOptional()
  @IsMongoId()
  divisionId?: string;

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
