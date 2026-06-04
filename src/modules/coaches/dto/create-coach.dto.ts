import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CoachStatus, CoachRole } from '../enums/coach.enum';

export class CreateCoachDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(60)
  @Transform(({ value }) => value?.trim())
  firstName!: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(60)
  @Transform(({ value }) => value?.trim())
  lastName!: string;

  @ApiProperty({ example: 'john.smith@nmsports.com' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @ApiPropertyOptional({ example: 10, description: 'Jersey number (0–999)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  @Type(() => Number)
  jerseyNumber?: number;

  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @ApiProperty({
    example: '64abc123def457',
    description: 'Team ID — selected from dropdown',
  })
  @IsMongoId()
  @IsNotEmpty()
  teamId!: string;

  @ApiPropertyOptional({
    enum: CoachRole,
    default: CoachRole.HEAD_COACH,
    example: CoachRole.HEAD_COACH,
  })
  @IsOptional()
  @IsEnum(CoachRole)
  coachRole?: CoachRole;

  @ApiPropertyOptional({
    example: '64abc123def458',
    description: 'Link to an existing user account (optional)',
  })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiPropertyOptional({
    enum: CoachStatus,
    default: CoachStatus.ACTIVE,
    description: 'active | inactive',
  })
  @IsOptional()
  @IsEnum(CoachStatus)
  status?: CoachStatus;

  @ApiPropertyOptional({ example: 'Former national team head coach' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
