import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { LeagueStatus } from '../enums/league.enum';

export type LeagueDocument = League & Document;

@Schema({
  timestamps: true,
  collection: 'leagues',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class League {
  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  currentSeason!: string; // e.g. '2024-25'

  @Prop({ trim: true })
  description?: string;

  @Prop({
    type: String,
    enum: LeagueStatus,
    default: LeagueStatus.UPCOMING,
    index: true,
  })
  status!: LeagueStatus;

  @Prop() seasonStartDate?: Date;
  @Prop() seasonEndDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const LeagueSchema = SchemaFactory.createForClass(League);

LeagueSchema.index({ name: 1, organizationId: 1 });
LeagueSchema.index({ organizationId: 1, status: 1 });
LeagueSchema.index({ currentSeason: 1 });
