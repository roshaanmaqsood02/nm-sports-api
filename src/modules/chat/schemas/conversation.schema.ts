import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ConversationType, ParticipantRole } from '../enums/chat.enum';

export type ConversationDocument = Conversation & Document;

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

  @Prop({ default: new Date(0) })
  lastReadAt!: Date;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastReadMessageId?: Types.ObjectId;

  @Prop({ default: false })
  isMuted!: boolean;

  @Prop({ default: Date.now })
  joinedAt!: Date;

  @Prop({ default: false })
  hasLeft!: boolean;

  @Prop()
  leftAt?: Date;
}

export const ParticipantSchema = SchemaFactory.createForClass(Participant);

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
  @Prop({
    type: String,
    enum: ConversationType,
    required: true,
    index: true,
  })
  type!: ConversationType;

  @Prop({ trim: true })
  name?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  avatar?: string;

  @Prop({ type: Types.ObjectId, ref: 'Organization', index: true })
  organizationId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Team', index: true })
  teamId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'League', index: true })
  leagueId?: Types.ObjectId;

  @Prop({ type: [ParticipantSchema], default: [] })
  participants!: Participant[];

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastMessageId?: Types.ObjectId;

  @Prop({ trim: true })
  lastMessageText?: string;

  @Prop()
  lastMessageAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  lastMessageBy?: Types.ObjectId;

  @Prop({ default: 0 })
  messageCount!: number;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isReadOnly!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.virtual('participantCount').get(function (
  this: ConversationDocument,
) {
  return this.participants.filter((p) => !p.hasLeft).length;
});

// Indexes
ConversationSchema.index({ 'participants.userId': 1 });
ConversationSchema.index({ type: 1, organizationId: 1 });
ConversationSchema.index({ type: 1, teamId: 1 });
ConversationSchema.index({ lastMessageAt: -1 });
ConversationSchema.index({ createdAt: -1 });
