import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MessageType } from '../enums/chat.enum';

export class SendMessageDto {
  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId()
  @IsNotEmpty()
  conversationId!: string;

  @ApiProperty({
    enum: MessageType,
    default: MessageType.TEXT,
    example: MessageType.TEXT,
  })
  @IsEnum(MessageType)
  type!: MessageType;

  @ApiPropertyOptional({ example: 'Hey team! Match tomorrow at 9am.' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  text?: string;

  // Reply to a message
  @ApiPropertyOptional({ example: '64abc123def457' })
  @IsOptional()
  @IsMongoId()
  replyToId?: string;
}

export class EditMessageDto {
  @ApiProperty({ example: 'Updated message text' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  text!: string;
}

export class ReactToMessageDto {
  @ApiProperty({ example: '👍' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  emoji!: string;
}

export class MarkReadDto {
  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId()
  @IsNotEmpty()
  conversationId!: string;

  @ApiPropertyOptional({
    example: '64abc123def457',
    description: 'Last message ID that was read',
  })
  @IsOptional()
  @IsMongoId()
  lastMessageId?: string;
}
