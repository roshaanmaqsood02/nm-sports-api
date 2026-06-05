import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  MaxLength,
  MinLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PlayerStatus } from '../enums/player.enum';

export class OtherContactDto {
  @ApiPropertyOptional({ example: 'babar@cricket.pk' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: '+923001234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Azam Sr. (Father)' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional({ example: '+923007654321' })
  @IsOptional()
  @IsString()
  emergencyPhone?: string;
}

export class CreatePlayerDto {
  @ApiProperty({ example: 'Babar Azam' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }) => value?.trim())
  name!: string;

  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId()
  @IsNotEmpty()
  organization!: string;

  @ApiProperty({ example: '64abc123def457' })
  @IsMongoId()
  @IsNotEmpty()
  team!: string;

  @ApiProperty({ example: ['Opening Batsman', 'Wicket Keeper'], isArray: true })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  positions!: string[];

  @ApiPropertyOptional({ example: 56 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  @Type(() => Number)
  number?: number;

  @ApiPropertyOptional({ enum: PlayerStatus, default: PlayerStatus.ACTIVE })
  @IsOptional()
  @IsEnum(PlayerStatus)
  status?: PlayerStatus;

  @ApiPropertyOptional({ example: 'Star player in the team' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => OtherContactDto)
  otherContact?: OtherContactDto;
}
