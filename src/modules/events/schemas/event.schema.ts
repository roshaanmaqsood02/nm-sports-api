import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  EventStatus,
  RepeatFrequency,
  EventVisibility,
  EventType,
} from '../enums/event.enum';

export type EventDocument = Event & Document;

@Schema({ _id: false })
export class EventVenue {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true }) street?: string;
  @Prop({ trim: true }) city?: string;
  @Prop({ trim: true }) state?: string;
  @Prop({ trim: true }) country?: string;
  @Prop({ trim: true }) zip?: string;
  @Prop({ trim: true }) fullAddress?: string;
  @Prop() lat?: number;
  @Prop() lng?: number;
}

@Schema({ _id: false })
export class RepeatConfig {
  @Prop({ default: false })
  enabled!: boolean;

  @Prop({ type: String, enum: RepeatFrequency })
  frequency?: RepeatFrequency;

  @Prop({ default: 1, min: 1 })
  interval!: number;

  @Prop({ type: [Number], default: [] })
  daysOfWeek!: number[];

  @Prop()
  endsOn?: Date;

  @Prop({ min: 1 })
  endsAfterOccurrences?: number;
}

@Schema({ _id: false })
export class EventTeamDetail {
  @Prop({ trim: true })
  arrivalTime?: string;

  @Prop({ trim: true, maxlength: 300 })
  uniformDetail?: string;

  @Prop({ trim: true, maxlength: 2000 })
  notes?: string;
}

@Schema({
  timestamps: true,
  collection: 'events',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Event {
  @Prop({ required: true, trim: true, index: true })
  eventName!: string;

  @Prop({
    type: String,
    enum: EventType,
    default: EventType.OTHER,
    index: true,
  })
  eventType!: EventType;

  @Prop({ trim: true, maxlength: 2000 })
  description?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Team' }], default: [] })
  teamIds!: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  teamNames!: string[];

  @Prop({ type: EventVenue, required: true })
  venue!: EventVenue;

  @Prop({ default: false })
  isAllDay!: boolean;

  @Prop({ required: true, index: true })
  date!: Date;

  @Prop({ trim: true })
  timeStart?: string;

  @Prop({ trim: true })
  timeEnd?: string;

  @Prop({ trim: true })
  timezone!: string;

  @Prop({ type: RepeatConfig, default: {} })
  repeat!: RepeatConfig;

  @Prop({ type: EventTeamDetail, default: {} })
  teamDetail!: EventTeamDetail;

  @Prop({
    type: String,
    enum: EventStatus,
    default: EventStatus.UPCOMING,
    index: true,
  })
  status!: EventStatus;

  @Prop({
    type: String,
    enum: EventVisibility,
    default: EventVisibility.TEAM,
  })
  visibility!: EventVisibility;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);

EventSchema.virtual('isUpcoming').get(function (this: EventDocument) {
  return this.date > new Date() && this.status === EventStatus.UPCOMING;
});

EventSchema.virtual('displayTime').get(function (this: EventDocument) {
  if (this.isAllDay) return 'All Day';
  const parts = [this.timeStart, this.timeEnd].filter(Boolean);
  const time = parts.join(' - ');
  return this.timezone ? `${time} ${this.timezone}` : time;
});

// Indexes
EventSchema.index({ organizationId: 1, date: -1 });
EventSchema.index({ organizationId: 1, status: 1 });
EventSchema.index({ teamIds: 1, date: -1 });
EventSchema.index({ date: -1 });
