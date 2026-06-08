import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  DeliveryStatus,
} from '../enums/notification.enum';

export type NotificationDocument = Notification & Document;

@Schema({ _id: false })
export class DeliveryReceipt {
  @Prop({ type: String, enum: NotificationChannel })
  channel!: NotificationChannel;

  @Prop({ type: String, enum: DeliveryStatus, default: DeliveryStatus.PENDING })
  status!: DeliveryStatus;

  @Prop() sentAt?: Date;
  @Prop() deliveredAt?: Date;
  @Prop({ trim: true }) errorMessage?: string;

  @Prop({ trim: true }) externalId?: string;
}

@Schema({
  timestamps: true,
  collection: 'notifications',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Notification {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ trim: true, lowercase: true })
  userEmail?: string;

  @Prop({ trim: true })
  deviceToken?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  senderId?: Types.ObjectId;

  @Prop({ trim: true })
  senderName?: string;

  @Prop({
    type: String,
    enum: NotificationType,
    required: true,
    index: true,
  })
  type!: NotificationType;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true, maxlength: 500 })
  body!: string;

  @Prop({ trim: true })
  htmlBody?: string;

  @Prop({ trim: true })
  actionUrl?: string;

  @Prop({ trim: true })
  actionLabel?: string;

  @Prop({ type: Object })
  data?: Record<string, any>;

  @Prop({
    type: String,
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
    index: true,
  })
  priority!: NotificationPriority;

  @Prop({ type: [String], enum: NotificationChannel, default: [] })
  channels!: NotificationChannel[];

  @Prop({ type: [DeliveryReceipt], default: [] })
  deliveryReceipts!: DeliveryReceipt[];

  @Prop({
    type: String,
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
    index: true,
  })
  status!: NotificationStatus;

  @Prop() readAt?: Date;

  @Prop({ type: Types.ObjectId, index: true })
  organizationId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  teamId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  matchId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  tournamentId?: Types.ObjectId;

  @Prop({ trim: true })
  imageUrl?: string;

  @Prop({ trim: true })
  iconUrl?: string;

  @Prop()
  expiresAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.virtual('isRead').get(function (this: NotificationDocument) {
  return this.status === NotificationStatus.READ;
});

NotificationSchema.virtual('isExpired').get(function (
  this: NotificationDocument,
) {
  return this.expiresAt ? this.expiresAt < new Date() : false;
});

// Indexe
NotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ organizationId: 1 });
// TTL — auto-delete notifications after 90 days
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 },
);
