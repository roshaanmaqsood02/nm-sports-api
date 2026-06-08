import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  EventStatus,
  RepeatFrequency,
  EventVisibility,
  EventType,
} from '../enums/event.enum';

export type EventDocument = Event & Document;

// ─── Embedded: Event Venue ────────────────────────────────────────────────────
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

// ─── Embedded: Repeat Config ──────────────────────────────────────────────────
@Schema({ _id: false })
export class RepeatConfig {
  @Prop({ default: false })
  enabled!: boolean;

  @Prop({ type: String, enum: RepeatFrequency })
  frequency?: RepeatFrequency;

  // e.g. every 2 weeks → interval = 2
  @Prop({ default: 1, min: 1 })
  interval!: number;

  // Days of week for weekly repeat (0 = Sun, 1 = Mon, ...)
  @Prop({ type: [Number], default: [] })
  daysOfWeek!: number[];

  // Repeat ends on this date
  @Prop()
  endsOn?: Date;

  // Or repeat ends after N occurrences
  @Prop({ min: 1 })
  endsAfterOccurrences?: number;
}

// ─── Embedded: Team Details ───────────────────────────────────────────────────
@Schema({ _id: false })
export class EventTeamDetail {
  @Prop({ trim: true })
  arrivalTime?: string; // e.g. "2:30 PM"

  @Prop({ trim: true, maxlength: 300 })
  uniformDetail?: string; // e.g. "Blue jersey, white shorts"

  @Prop({ trim: true, maxlength: 2000 })
  notes?: string;
}

// ─── Main Event Schema ────────────────────────────────────────────────────────
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
  // ── Identity ─────────────────────────────────────────────────
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

  // ── Organization & Team ───────────────────────────────────────
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  // Teams attached to this event
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Team' }], default: [] })
  teamIds!: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  teamNames!: string[];

  // ── Venue ─────────────────────────────────────────────────────
  @Prop({ type: EventVenue, required: true })
  venue!: EventVenue;

  // ── All Day ───────────────────────────────────────────────────
  @Prop({ default: false })
  isAllDay!: boolean;

  // ── Date & Time ───────────────────────────────────────────────
  @Prop({ required: true, index: true })
  date!: Date;

  @Prop({ trim: true })
  timeStart?: string; // e.g. "9:00 AM"

  @Prop({ trim: true })
  timeEnd?: string; // e.g. "5:00 PM"

  @Prop({ trim: true })
  timezone!: string; // e.g. "EDT", "America/Chicago"

  // ── Repeat ───────────────────────────────────────────────────
  @Prop({ type: RepeatConfig, default: {} })
  repeat!: RepeatConfig;

  // ── Team Details ──────────────────────────────────────────────
  @Prop({ type: EventTeamDetail, default: {} })
  teamDetail!: EventTeamDetail;

  // ── Status ───────────────────────────────────────────────────
  @Prop({
    type: String,
    enum: EventStatus,
    default: EventStatus.UPCOMING,
    index: true,
  })
  status!: EventStatus;

  // ── Visibility ───────────────────────────────────────────────
  @Prop({
    type: String,
    enum: EventVisibility,
    default: EventVisibility.TEAM,
  })
  visibility!: EventVisibility;

  // ── Ownership ────────────────────────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  // ── Soft Delete ───────────────────────────────────────────────
  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
EventSchema.virtual('isUpcoming').get(function (this: EventDocument) {
  return this.date > new Date() && this.status === EventStatus.UPCOMING;
});

EventSchema.virtual('displayTime').get(function (this: EventDocument) {
  if (this.isAllDay) return 'All Day';
  const parts = [this.timeStart, this.timeEnd].filter(Boolean);
  const time = parts.join(' - ');
  return this.timezone ? `${time} ${this.timezone}` : time;
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
EventSchema.index({ organizationId: 1, date: -1 });
EventSchema.index({ organizationId: 1, status: 1 });
EventSchema.index({ teamIds: 1, date: -1 });
EventSchema.index({ date: -1 });
