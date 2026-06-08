import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  NotificationType,
  NotificationChannel,
} from '../enums/notification.enum';

export type NotificationPreferenceDocument = NotificationPreference & Document;

@Schema({ _id: false })
export class TypePreference {
  @Prop({ type: String, enum: NotificationType, required: true })
  type!: NotificationType;

  @Prop({ default: true }) inApp!: boolean;
  @Prop({ default: true }) email!: boolean;
  @Prop({ default: true }) push!: boolean;
}

@Schema({
  timestamps: true,
  collection: 'notification_preferences',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class NotificationPreference {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ default: true }) inAppEnabled!: boolean;
  @Prop({ default: true }) emailEnabled!: boolean;
  @Prop({ default: true }) pushEnabled!: boolean;

  @Prop({ default: false }) quietHoursEnabled!: boolean;
  @Prop({ default: 22 }) quietHoursStart!: number; // 22 = 10pm
  @Prop({ default: 8 }) quietHoursEnd!: number; // 8  = 8am
  @Prop({ default: 'UTC' }) timezone!: string;

  @Prop({ type: [String], default: [] })
  deviceTokens!: string[];

  @Prop({ type: [TypePreference], default: [] })
  typePreferences!: TypePreference[];
}

export const NotificationPreferenceSchema = SchemaFactory.createForClass(
  NotificationPreference,
);
