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
import { TeamGender, TeamType, TeamStatus } from '../enums/team.enum';

export class CreateTeamDto {
  @ApiProperty({ example: 'Lahore Lions Cricket Club' })
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

  @ApiProperty({
    example: 'LLC',
    description: 'Max 8 uppercase alphanumeric characters',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Abbreviation must be uppercase letters and numbers only',
  })
  @Transform(({ value }) => value?.toUpperCase().trim())
  abbreviation!: string;

  @ApiProperty({ enum: SportType, example: SportType.CRICKET })
  @IsEnum(SportType)
  sport!: SportType;

  @ApiProperty({ enum: TeamGender, example: TeamGender.MALE })
  @IsEnum(TeamGender)
  gender!: TeamGender;

  @ApiProperty({
    enum: TeamType,
    default: TeamType.CLUB,
    description: 'Is this a club team or a league team?',
  })
  @IsEnum(TeamType)
  type!: TeamType;

  @ApiProperty({ example: '2024-25' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Transform(({ value }) => value?.trim())
  season!: string;

  @ApiPropertyOptional({
    example: 'Spring',
    description: 'Sub-season or phase e.g. Spring, Fall, Group Stage',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  subSeason?: string;

  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId({ message: 'organizationId must be a valid MongoDB ObjectId' })
  @IsNotEmpty()
  organizationId!: string;

  @ApiPropertyOptional({ example: '#1A73E8' })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'primaryColor must be a valid hex code e.g. #1A73E8',
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
