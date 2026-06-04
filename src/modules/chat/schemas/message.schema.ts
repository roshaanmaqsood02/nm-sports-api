import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MessageType, MessageStatus } from '../enums/chat.enum';

export type MessageDocument = Message & Document;

// ─── Embedded: Attachment ────────────────────────────────────────────────────
@Schema({ _id: false })
export class MessageAttachment {
  @Prop({ trim: true }) filename!: string;
  @Prop({ trim: true }) url!: string;
  @Prop({ trim: true }) mimeType!: string;
  @Prop({ default: 0 }) size!: number;
  @Prop() width?: number;
  @Prop() height?: number;
}

// ─── Embedded: Reaction ───────────────────────────────────────────────────────
@Schema({ _id: false })
export class MessageReaction {
  @Prop({ trim: true, required: true })
  emoji!: string; // e.g. '👍', '❤️', '😂'

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  userIds!: Types.ObjectId[]; // users who reacted

  @Prop({ default: 0 })
  count!: number;
}

// ─── Embedded: Read Receipt ──────────────────────────────────────────────────
@Schema({ _id: false })
export class ReadReceipt {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  readAt!: Date;
}

// ─── Main Message Schema ──────────────────────────────────────────────────────
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
  // ── Conversation ──────────────────────────────────────────────
  @Prop({
    type: Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  })
  conversationId!: Types.ObjectId;

  // ── Sender ────────────────────────────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  senderId!: Types.ObjectId;

  @Prop({ trim: true })
  senderName?: string;

  @Prop({ trim: true })
  senderAvatar?: string;

  // ── Content ───────────────────────────────────────────────────
  @Prop({
    type: String,
    enum: MessageType,
    default: MessageType.TEXT,
    index: true,
  })
  type!: MessageType;

  @Prop({ trim: true, maxlength: 4000 })
  text?: string;

  // ── Attachment (for image/file/audio) ────────────────────────
  @Prop({ type: MessageAttachment })
  attachment?: MessageAttachment;

  // ── Reply ─────────────────────────────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'Message', index: true })
  replyToId?: Types.ObjectId;

  @Prop({ trim: true })
  replyToText?: string; // snapshot of replied message text

  @Prop({ trim: true })
  replyToSender?: string; // snapshot of replied message sender name

  // ── Reactions ────────────────────────────────────────────────
  @Prop({ type: [MessageReaction], default: [] })
  reactions!: MessageReaction[];

  // ── Read receipts ─────────────────────────────────────────────
  @Prop({ type: [ReadReceipt], default: [] })
  readBy!: ReadReceipt[];

  // ── Status ───────────────────────────────────────────────────
  @Prop({
    type: String,
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  status!: MessageStatus;

  // ── Edit history ──────────────────────────────────────────────
  @Prop({ default: false })
  isEdited!: boolean;

  @Prop()
  editedAt?: Date;

  // ── Soft delete ───────────────────────────────────────────────
  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop()
  deletedAt?: Date;

  // System message flag (join/leave/rename events)
  @Prop({ default: false })
  isSystem!: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// ─── Indexes ──────────────────────────────────────────────────────────────────
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ conversationId: 1, isDeleted: 1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ replyToId: 1 });
// TTL: auto-delete messages older than 1 year (adjust as needed)
MessageSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 365 },
);
