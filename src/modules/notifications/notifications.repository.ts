import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import {
  NotificationPreference,
  NotificationPreferenceDocument,
} from './schemas/notification-preference.schema';
import { NotificationStatus } from './enums/notification.enum';

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,

    @InjectModel(NotificationPreference.name)
    private readonly preferenceModel: Model<NotificationPreferenceDocument>,
  ) {}

  async create(data: Partial<Notification>): Promise<NotificationDocument> {
    return new this.notificationModel(data).save();
  }

  async createMany(data: Partial<Notification>[]): Promise<void> {
    await this.notificationModel.insertMany(data);
  }

  async findById(id: string): Promise<NotificationDocument | null> {
    return this.notificationModel.findById(id).exec();
  }

  async findMany(
    filter: Record<string, any>,
    page = 1,
    limit = 20,
  ): Promise<{
    data: NotificationDocument[];
    total: number;
    unreadCount: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(filter).exec(),
      this.notificationModel
        .countDocuments({
          ...filter,
          status: NotificationStatus.UNREAD,
        })
        .exec(),
    ]);

    return { data, total, unreadCount };
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.notificationModel.updateOne(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      {
        $set: {
          status: NotificationStatus.READ,
          readAt: new Date(),
        },
      },
    );
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.notificationModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        status: NotificationStatus.UNREAD,
      },
      {
        $set: {
          status: NotificationStatus.READ,
          readAt: new Date(),
        },
      },
    );
    return result.modifiedCount;
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await this.notificationModel.updateOne(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: { status: NotificationStatus.DELETED } },
    );
  }

  async deleteAll(userId: string): Promise<void> {
    await this.notificationModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      status: NotificationStatus.UNREAD,
    });
  }

  async updateDeliveryReceipt(
    id: string,
    channel: string,
    update: {
      status?: string;
      sentAt?: Date;
      deliveredAt?: Date;
      externalId?: string;
      error?: string;
    },
  ): Promise<void> {
    const objectId = new Types.ObjectId(id);

    const updateObj: Record<string, any> = {};
    if (update.status !== undefined)
      updateObj['deliveryReceipts.$.status'] = update.status;
    if (update.sentAt !== undefined)
      updateObj['deliveryReceipts.$.sentAt'] = update.sentAt;
    if (update.deliveredAt !== undefined)
      updateObj['deliveryReceipts.$.deliveredAt'] = update.deliveredAt;
    if (update.externalId !== undefined)
      updateObj['deliveryReceipts.$.externalId'] = update.externalId;
    if (update.error !== undefined)
      updateObj['deliveryReceipts.$.error'] = update.error;

    if (Object.keys(updateObj).length === 0) return;

    await this.notificationModel.updateOne(
      { _id: objectId, 'deliveryReceipts.channel': channel } as any,
      { $set: updateObj },
    );
  }

  async getPreference(
    userId: string,
  ): Promise<NotificationPreferenceDocument | null> {
    return this.preferenceModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
  }

  async upsertPreference(
    userId: string,
    data: Record<string, any>,
  ): Promise<NotificationPreferenceDocument> {
    return this.preferenceModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: data },
        { new: true, upsert: true },
      )
      .exec() as Promise<NotificationPreferenceDocument>;
  }

  async addDeviceToken(userId: string, token: string): Promise<void> {
    await this.preferenceModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      { $addToSet: { deviceTokens: token } },
      { upsert: true },
    );
  }

  async removeDeviceToken(userId: string, token: string): Promise<void> {
    await this.preferenceModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      { $pull: { deviceTokens: token } },
    );
  }

  async getUserDeviceTokens(userId: string): Promise<string[]> {
    const pref = await this.preferenceModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .select('deviceTokens')
      .lean()
      .exec();

    return (pref as any)?.deviceTokens ?? [];
  }
}
