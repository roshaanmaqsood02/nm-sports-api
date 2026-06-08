import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { NotificationsRepository } from './notifications.repository';
import { EmailChannel } from './channels/email.channel';
import { PushChannel } from './channels/push.channel';
import { InAppChannel } from './channels/in-app.channel';
import {
  CreateNotificationDto,
  BroadcastNotificationDto,
} from './dto/create-notification.dto';
import {
  UpdateNotificationPreferenceDto,
  RegisterDeviceTokenDto,
} from './dto/notification-preference.dto';
import { NotificationDocument } from './schemas/notification.schema';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  DeliveryStatus,
} from './enums/notification.enum';
import { RequestUser } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly repo: NotificationsRepository,
    private readonly emailChannel: EmailChannel,
    private readonly pushChannel: PushChannel,
    private readonly inAppChannel: InAppChannel,
  ) {}

  async send(dto: CreateNotificationDto): Promise<NotificationDocument> {
    const channels = dto.channels ?? [
      NotificationChannel.IN_APP,
      NotificationChannel.EMAIL,
    ];

    const preference = await this.repo.getPreference(dto.userId);

    const deliveryReceipts = channels.map((channel) => ({
      channel,
      status: DeliveryStatus.PENDING,
    }));

    const deviceToken =
      dto.deviceToken ?? (await this.repo.getUserDeviceTokens(dto.userId))[0];

    const notification = await this.repo.create({
      userId: new Types.ObjectId(dto.userId),
      userEmail: dto.userEmail,
      deviceToken,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      channels,
      deliveryReceipts,
      priority: dto.priority ?? NotificationPriority.MEDIUM,
      actionUrl: dto.actionUrl,
      actionLabel: dto.actionLabel,
      data: dto.data,
      imageUrl: dto.imageUrl,
      organizationId: dto.organizationId
        ? new Types.ObjectId(dto.organizationId)
        : undefined,
      teamId: dto.teamId ? new Types.ObjectId(dto.teamId) : undefined,
      matchId: dto.matchId ? new Types.ObjectId(dto.matchId) : undefined,
      tournamentId: dto.tournamentId
        ? new Types.ObjectId(dto.tournamentId)
        : undefined,
      status: NotificationStatus.UNREAD,
    });

    const dispatches = channels.map((channel) =>
      this.dispatchToChannel(notification, channel, preference),
    );

    await Promise.allSettled(dispatches);

    return notification;
  }

  async broadcast(dto: BroadcastNotificationDto): Promise<{ sent: number }> {
    const results = await Promise.allSettled(
      dto.userIds.map((userId) => this.send({ ...dto, userId })),
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    this.logger.log(`Broadcast: ${sent}/${dto.userIds.length} sent`);
    return { sent };
  }

  async sendSystemAnnouncement(
    title: string,
    body: string,
    userIds: string[],
    data?: Record<string, any>,
  ): Promise<{ sent: number }> {
    const { NotificationType } = await import('./enums/notification.enum.js');

    return this.broadcast({
      userIds,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title,
      body,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      priority: NotificationPriority.HIGH,
      data,
    } as BroadcastNotificationDto);
  }

  private async dispatchToChannel(
    notification: NotificationDocument,
    channel: NotificationChannel,
    preference: any,
  ): Promise<void> {
    if (preference && this.isQuietHours(preference)) {
      if (
        channel === NotificationChannel.PUSH ||
        channel === NotificationChannel.EMAIL
      ) {
        const priority = notification.priority;
        if (
          priority !== NotificationPriority.URGENT &&
          priority !== NotificationPriority.HIGH
        ) {
          await this.updateReceipt(
            notification,
            channel,
            DeliveryStatus.SKIPPED,
          );
          return;
        }
      }
    }

    if (preference) {
      const typePref = preference.typePreferences?.find(
        (p: any) => p.type === notification.type,
      );

      if (typePref) {
        const channelEnabled =
          (channel === NotificationChannel.IN_APP &&
            typePref.inApp === false) ||
          (channel === NotificationChannel.EMAIL && typePref.email === false) ||
          (channel === NotificationChannel.PUSH && typePref.push === false);

        if (channelEnabled) {
          await this.updateReceipt(
            notification,
            channel,
            DeliveryStatus.SKIPPED,
          );
          return;
        }
      }

      // Global toggles
      if (channel === NotificationChannel.EMAIL && !preference.emailEnabled) {
        await this.updateReceipt(notification, channel, DeliveryStatus.SKIPPED);
        return;
      }
      if (channel === NotificationChannel.PUSH && !preference.pushEnabled) {
        await this.updateReceipt(notification, channel, DeliveryStatus.SKIPPED);
        return;
      }
      if (channel === NotificationChannel.IN_APP && !preference.inAppEnabled) {
        await this.updateReceipt(notification, channel, DeliveryStatus.SKIPPED);
        return;
      }
    }

    // Send via appropriate channel
    let result: { status: DeliveryStatus; externalId?: string; error?: string };

    switch (channel) {
      case NotificationChannel.IN_APP:
        result = await this.inAppChannel.send(notification);
        break;
      case NotificationChannel.EMAIL:
        result = await this.emailChannel.send(notification);
        break;
      case NotificationChannel.PUSH:
        result = await this.pushChannel.send(notification);
        break;
      default:
        return;
    }

    await this.updateReceipt(notification, channel, result.status, result);
  }

  private async updateReceipt(
    notification: NotificationDocument,
    channel: NotificationChannel,
    status: DeliveryStatus,
    extra?: { externalId?: string; error?: string },
  ): Promise<void> {
    // Build the update object
    const update: {
      status?: string;
      sentAt?: Date;
      deliveredAt?: Date;
      externalId?: string;
      error?: string;
    } = {
      status,
    };

    if (status === DeliveryStatus.SENT || status === DeliveryStatus.DELIVERED) {
      update.sentAt = new Date();
    }
    if (status === DeliveryStatus.DELIVERED) {
      update.deliveredAt = new Date();
    }
    if (extra?.externalId) {
      update.externalId = extra.externalId;
    }
    if (extra?.error) {
      update.error = extra.error;
    }

    // Call repository with individual fields, not a $set object
    await this.repo.updateDeliveryReceipt(
      (notification._id as any).toString(),
      channel,
      update,
    );
  }

  async getMyNotifications(
    user: RequestUser,
    page = 1,
    limit = 20,
    filters: { type?: string; status?: string } = {},
  ) {
    const filter: Record<string, any> = {
      userId: new Types.ObjectId(user._id),
      status: { $ne: NotificationStatus.DELETED },
    };

    if (filters.type) filter['type'] = filters.type;
    if (filters.status) filter['status'] = filters.status;

    const { data, total, unreadCount } = await this.repo.findMany(
      filter,
      page,
      limit,
    );

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.repo.countUnread(userId);
    return { count };
  }

  async markRead(id: string, user: RequestUser): Promise<{ message: string }> {
    await this.repo.markRead(id, user._id);
    return { message: 'Notification marked as read' };
  }

  async markAllRead(
    user: RequestUser,
  ): Promise<{ message: string; count: number }> {
    const count = await this.repo.markAllRead(user._id);
    return { message: 'All notifications marked as read', count };
  }

  async deleteNotification(
    id: string,
    user: RequestUser,
  ): Promise<{ message: string }> {
    await this.repo.softDelete(id, user._id);
    return { message: 'Notification deleted' };
  }

  async clearAll(user: RequestUser): Promise<{ message: string }> {
    await this.repo.deleteAll(user._id);
    return { message: 'All notifications cleared' };
  }

  async getStats(user: RequestUser) {
    const {
      data: all,
      total,
      unreadCount,
    } = await this.repo.findMany(
      {
        userId: new Types.ObjectId(user._id),
        status: { $ne: NotificationStatus.DELETED },
      },
      1,
      1,
    );

    return {
      total,
      unread: unreadCount,
      read: total - unreadCount,
    };
  }

  async getPreferences(user: RequestUser) {
    const pref = await this.repo.getPreference(user._id);

    if (!pref) {
      // Return defaults
      return {
        userId: user._id,
        inAppEnabled: true,
        emailEnabled: true,
        pushEnabled: true,
        quietHoursEnabled: false,
        quietHoursStart: 22,
        quietHoursEnd: 8,
        timezone: 'UTC',
        deviceTokens: [],
        typePreferences: [],
      };
    }

    return pref;
  }

  async updatePreferences(
    dto: UpdateNotificationPreferenceDto,
    user: RequestUser,
  ) {
    const payload: Record<string, any> = {};
    const fields = [
      'inAppEnabled',
      'emailEnabled',
      'pushEnabled',
      'quietHoursEnabled',
      'quietHoursStart',
      'quietHoursEnd',
      'timezone',
    ];

    fields.forEach((f) => {
      if ((dto as any)[f] !== undefined) payload[f] = (dto as any)[f];
    });

    if (dto.typePreferences) {
      payload['typePreferences'] = dto.typePreferences;
    }

    return this.repo.upsertPreference(user._id, payload);
  }

  async registerDeviceToken(
    dto: RegisterDeviceTokenDto,
    user: RequestUser,
  ): Promise<{ message: string }> {
    await this.repo.addDeviceToken(user._id, dto.token);
    return { message: 'Device token registered' };
  }

  async removeDeviceToken(
    token: string,
    user: RequestUser,
  ): Promise<{ message: string }> {
    await this.repo.removeDeviceToken(user._id, token);
    return { message: 'Device token removed' };
  }

  async adminSend(
    dto: CreateNotificationDto,
    user: RequestUser,
  ): Promise<NotificationDocument> {
    return this.send(dto);
  }

  // Helpers
  private isQuietHours(preference: any): boolean {
    if (!preference.quietHoursEnabled) return false;

    const now = new Date();
    const hour = now.getUTCHours();
    const start = preference.quietHoursStart ?? 22;
    const end = preference.quietHoursEnd ?? 8;

    if (start > end) {
      // Overnight window: e.g. 22 → 8
      return hour >= start || hour < end;
    }
    // Same-day window
    return hour >= start && hour < end;
  }
}
