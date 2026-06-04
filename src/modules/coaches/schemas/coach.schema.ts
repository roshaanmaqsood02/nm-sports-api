import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CoachStatus, CoachRole } from '../enums/coach.enum';

export type CoachDocument = Coach & Document;

@Schema({
  timestamps: true,
  collection: 'coaches',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Coach {
  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({
    required: true,
    trim: true,
    lowercase: true,
    index: true,
  })
  email!: string;

  @Prop({ min: 0, max: 999 })
  jerseyNumber?: number;

  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Team',
    required: true,
    index: true,
  })
  teamId!: Types.ObjectId;

  @Prop({ trim: true })
  teamName?: string;

  @Prop({
    type: String,
    enum: CoachRole,
    default: CoachRole.HEAD_COACH,
  })
  coachRole!: CoachRole;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: CoachStatus,
    default: CoachStatus.ACTIVE,
    index: true,
  })
  status!: CoachStatus;

  @Prop({ trim: true, maxlength: 500 })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const CoachSchema = SchemaFactory.createForClass(Coach);

CoachSchema.virtual('fullName').get(function (this: CoachDocument) {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes
CoachSchema.index({ email: 1, organizationId: 1 }, { unique: true });
CoachSchema.index({ teamId: 1, status: 1 });
CoachSchema.index({ organizationId: 1, status: 1 });
CoachSchema.index({ createdAt: -1 });
