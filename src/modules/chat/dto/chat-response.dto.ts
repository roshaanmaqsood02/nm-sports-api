import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ConversationType,
  MessageType,
  MessageStatus,
  ParticipantRole,
} from '../enums/chat.enum';

export class ParticipantDto {
  @ApiProperty() userId!: string;
  @ApiPropertyOptional() fullName?: string;
  @ApiPropertyOptional() avatar?: string;
  @ApiProperty({ enum: ParticipantRole }) role!: ParticipantRole;
  @ApiProperty() lastReadAt!: Date;
  @ApiProperty() isMuted!: boolean;
  @ApiProperty() joinedAt!: Date;
  @ApiProperty() hasLeft!: boolean;
}

export class ConversationResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty({ enum: ConversationType }) type!: ConversationType;
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() avatar?: string;
  @ApiPropertyOptional() organizationId?: string;
  @ApiPropertyOptional() teamId?: string;
  @ApiPropertyOptional() leagueId?: string;
  @ApiProperty({ type: [ParticipantDto] }) participants!: ParticipantDto[];
  @ApiProperty() participantCount!: number;
  @ApiPropertyOptional() lastMessageId?: string;
  @ApiPropertyOptional() lastMessageText?: string;
  @ApiPropertyOptional() lastMessageAt?: Date;
  @ApiProperty() messageCount!: number;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() isReadOnly!: boolean;
  @ApiProperty() unreadCount?: number; // computed per user
  @ApiProperty() createdBy!: string;
  @ApiProperty() createdAt!: Date;
}

export class MessageAttachmentDto {
  @ApiProperty() filename!: string;
  @ApiProperty() url!: string;
  @ApiProperty() mimeType!: string;
  @ApiProperty() size!: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;
}

export class MessageResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() conversationId!: string;
  @ApiProperty() senderId!: string;
  @ApiPropertyOptional() senderName?: string;
  @ApiPropertyOptional() senderAvatar?: string;
  @ApiProperty({ enum: MessageType }) type!: MessageType;
  @ApiPropertyOptional() text?: string;
  @ApiPropertyOptional({ type: () => MessageAttachmentDto })
  attachment?: MessageAttachmentDto;
  @ApiPropertyOptional() replyToId?: string;
  @ApiPropertyOptional() replyToText?: string;
  @ApiPropertyOptional() replyToSender?: string;
  @ApiProperty() reactions!: any[];
  @ApiProperty() readBy!: any[];
  @ApiProperty({ enum: MessageStatus }) status!: MessageStatus;
  @ApiProperty() isEdited!: boolean;
  @ApiPropertyOptional() editedAt?: Date;
  @ApiProperty() isDeleted!: boolean;
  @ApiProperty() isSystem!: boolean;
  @ApiProperty() createdAt!: Date;
}

export class PaginatedMessagesDto {
  @ApiProperty({ type: [MessageResponseDto] }) data!: MessageResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasMore!: boolean;
}

export class PaginatedConversationsDto {
  @ApiProperty({ type: [ConversationResponseDto] })
  data!: ConversationResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}
