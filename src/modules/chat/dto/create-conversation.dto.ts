import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ArrayMinSize,
} from 'class-validator';
import { ConversationType } from '../enums/chat.enum';

export class CreateConversationDto {
  @ApiProperty({
    enum: ConversationType,
    example: ConversationType.DIRECT,
    description: 'direct | group | team | organization | league',
  })
  @IsEnum(ConversationType)
  type!: ConversationType;

  // ── Group / channel specific ──────────────────────────────────
  @ApiPropertyOptional({ example: 'Team Strategy Room' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Private strategy discussion' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  // ── Participants ──────────────────────────────────────────────
  @ApiProperty({
    example: ['64abc123def456', '64abc123def457'],
    description:
      'Array of user IDs. For direct: 1 other user. For group: 2+ users.',
  })
  @IsArray()
  @IsMongoId({ each: true })
  @ArrayMinSize(1)
  participantIds!: string[];

  // ── Context refs ─────────────────────────────────────────────
  @ApiPropertyOptional({ example: '64abc123def456' })
  @IsOptional()
  @IsMongoId()
  organizationId?: string;

  @ApiPropertyOptional({ example: '64abc123def457' })
  @IsOptional()
  @IsMongoId()
  teamId?: string;

  @ApiPropertyOptional({ example: '64abc123def458' })
  @IsOptional()
  @IsMongoId()
  leagueId?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isReadOnly?: boolean;
}

export class AddParticipantsDto {
  @ApiProperty({ example: ['64abc123def456'] })
  @IsArray()
  @IsMongoId({ each: true })
  @ArrayMinSize(1)
  userIds!: string[];
}

export class UpdateConversationDto {
  @ApiPropertyOptional({ example: 'Updated Group Name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isReadOnly?: boolean;
}
