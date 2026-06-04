import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ConversationType, ParticipantRole } from '../enums/chat.enum';

export type ConversationDocument = Conversation & Document;

// ─── Embedded: Participant ────────────────────────────────────────────────────
@Schema({ _id: false })
export class Participant {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ trim: true })
  fullName?: string;

  @Prop({ trim: true })
  avatar?: string;

  @Prop({
    type: String,
    enum: ParticipantRole,
    default: ParticipantRole.MEMBER,
  })
  role!: ParticipantRole;

  // Last time this participant read messages
  @Prop({ default: new Date(0) })
  lastReadAt!: Date;

  // Last message ID this participant read
  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastReadMessageId?: Types.ObjectId;

  @Prop({ default: false })
  isMuted!: boolean;

  // When the user joined this conversation
  @Prop({ default: Date.now })
  joinedAt!: Date;

  // Soft-left the conversation (still in DB but hidden for user)
  @Prop({ default: false })
  hasLeft!: boolean;

  @Prop()
  leftAt?: Date;
}

export const ParticipantSchema = SchemaFactory.createForClass(Participant);

// ─── Main Conversation Schema ─────────────────────────────────────────────────
@Schema({
  timestamps: true,
  collection: 'conversations',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Conversation {
  // ── Type ─────────────────────────────────────────────────────
  @Prop({
    type: String,
    enum: ConversationType,
    required: true,
    index: true,
  })
  type!: ConversationType;

  // ── Name (groups only) ────────────────────────────────────────
  @Prop({ trim: true })
  name?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  avatar?: string;

  // ── Context references ────────────────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'Organization', index: true })
  organizationId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Team', index: true })
  teamId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'League', index: true })
  leagueId?: Types.ObjectId;

  // ── Participants ──────────────────────────────────────────────
  @Prop({ type: [ParticipantSchema], default: [] })
  participants!: Participant[];

  // ── Last message snapshot (for list view) ────────────────────
  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastMessageId?: Types.ObjectId;

  @Prop({ trim: true })
  lastMessageText?: string;

  @Prop()
  lastMessageAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  lastMessageBy?: Types.ObjectId;

  // ── Message count ─────────────────────────────────────────────
  @Prop({ default: 0 })
  messageCount!: number;

  // ── Settings ─────────────────────────────────────────────────
  @Prop({ default: true })
  isActive!: boolean;

  // Only admin can send (broadcast mode)
  @Prop({ default: false })
  isReadOnly!: boolean;

  // ── Ownership ────────────────────────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
ConversationSchema.virtual('participantCount').get(function (
  this: ConversationDocument,
) {
  return this.participants.filter((p) => !p.hasLeft).length;
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
ConversationSchema.index({ 'participants.userId': 1 });
ConversationSchema.index({ type: 1, organizationId: 1 });
ConversationSchema.index({ type: 1, teamId: 1 });
ConversationSchema.index({ lastMessageAt: -1 });
ConversationSchema.index({ createdAt: -1 });
