import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MessageType, MessageStatus } from '../enums/chat.enum';

export type MessageDocument = Message & Document;

@Schema({ _id: false })
export class MessageAttachment {
  @Prop({ trim: true }) filename!: string;
  @Prop({ trim: true }) url!: string;
  @Prop({ trim: true }) mimeType!: string;
  @Prop({ default: 0 }) size!: number;
  @Prop() width?: number;
  @Prop() height?: number;
}

@Schema({ _id: false })
export class MessageReaction {
  @Prop({ trim: true, required: true })
  emoji!: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  userIds!: Types.ObjectId[];

  @Prop({ default: 0 })
  count!: number;
}

@Schema({ _id: false })
export class ReadReceipt {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  readAt!: Date;
}

@Schema({
  timestamps: true,
  collection: 'messages',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Message {
  @Prop({
    type: Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  })
  conversationId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  senderId!: Types.ObjectId;

  @Prop({ trim: true })
  senderName?: string;

  @Prop({ trim: true })
  senderAvatar?: string;

  @Prop({
    type: String,
    enum: MessageType,
    default: MessageType.TEXT,
    index: true,
  })
  type!: MessageType;

  @Prop({ trim: true, maxlength: 4000 })
  text?: string;

  @Prop({ type: MessageAttachment })
  attachment?: MessageAttachment;

  @Prop({ type: Types.ObjectId, ref: 'Message', index: true })
  replyToId?: Types.ObjectId;

  @Prop({ trim: true })
  replyToText?: string;

  @Prop({ trim: true })
  replyToSender?: string;

  @Prop({ type: [MessageReaction], default: [] })
  reactions!: MessageReaction[];

  @Prop({ type: [ReadReceipt], default: [] })
  readBy!: ReadReceipt[];

  @Prop({
    type: String,
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  status!: MessageStatus;

  @Prop({ default: false })
  isEdited!: boolean;

  @Prop()
  editedAt?: Date;

  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop({ default: false })
  isSystem!: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ conversationId: 1, isDeleted: 1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ replyToId: 1 });
// TTL: auto-delete messages older than 1 year (adjust as needed)
MessageSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 365 },
);
