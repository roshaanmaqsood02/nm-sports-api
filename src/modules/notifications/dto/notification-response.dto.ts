import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  NotificationChannel,
  DeliveryStatus,
} from '../enums/notification.enum';

export class DeliveryReceiptDto {
  @ApiProperty({ enum: NotificationChannel }) channel!: NotificationChannel;
  @ApiProperty({ enum: DeliveryStatus }) status!: DeliveryStatus;
  @ApiPropertyOptional() sentAt?: Date;
  @ApiPropertyOptional() deliveredAt?: Date;
  @ApiPropertyOptional() errorMessage?: string;
}

export class NotificationResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() userId!: string;
  @ApiPropertyOptional() senderName?: string;
  @ApiProperty({ enum: NotificationType }) type!: NotificationType;
  @ApiProperty() title!: string;
  @ApiProperty() body!: string;
  @ApiPropertyOptional() actionUrl?: string;
  @ApiPropertyOptional() actionLabel?: string;
  @ApiPropertyOptional() data?: Record<string, any>;
  @ApiProperty({ enum: NotificationPriority }) priority!: NotificationPriority;
  @ApiProperty({ type: [String] }) channels!: string[];
  @ApiProperty({ type: [DeliveryReceiptDto] })
  deliveryReceipts!: DeliveryReceiptDto[];
  @ApiProperty({ enum: NotificationStatus }) status!: NotificationStatus;
  @ApiProperty() isRead!: boolean;
  @ApiPropertyOptional() readAt?: Date;
  @ApiPropertyOptional() imageUrl?: string;
  @ApiPropertyOptional() organizationId?: string;
  @ApiPropertyOptional() matchId?: string;
  @ApiProperty() createdAt!: Date;
}

export class PaginatedNotificationsDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  data!: NotificationResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() unreadCount!: number;
}

export class NotificationStatsDto {
  @ApiProperty() total!: number;
  @ApiProperty() unread!: number;
  @ApiProperty() read!: number;
}
