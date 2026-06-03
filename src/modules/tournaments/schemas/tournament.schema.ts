import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SportType } from '../../organizations/enums/organization.enum';
import {
  TournamentStatus,
  TournamentFormat,
  TournamentTeamStatus,
  TournamentVisibility,
} from '../enums/tournament.enum';

export type TournamentDocument = Tournament & Document;

// Embedded: Prize
@Schema({ _id: false })
export class TournamentPrize {
  @Prop({ trim: true }) first?: string;
  @Prop({ trim: true }) second?: string;
  @Prop({ trim: true }) third?: string;
  @Prop({ trim: true }) description?: string;
}

// Embedded: Contact
@Schema({ _id: false })
export class TournamentContact {
  @Prop({ trim: true }) name?: string;
  @Prop({ trim: true }) email?: string;
  @Prop({ trim: true }) phone?: string;
}

// Embedded: Venue
@Schema({ _id: false })
export class TournamentVenue {
  @Prop({ trim: true }) name?: string;
  @Prop({ trim: true }) address?: string;
  @Prop({ trim: true }) city?: string;
  @Prop({ trim: true }) country?: string;
}

// Embedded: Registered Team
@Schema({ _id: true, timestamps: { createdAt: true, updatedAt: false } })
export class TournamentTeam {
  @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
  teamId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  teamName!: string;

  @Prop({ trim: true })
  teamAbbreviation?: string;

  @Prop({ min: 1 })
  seed?: number;

  @Prop({ trim: true, uppercase: true })
  group?: string;

  @Prop({
    type: String,
    enum: TournamentTeamStatus,
    default: TournamentTeamStatus.REGISTERED,
  })
  status!: TournamentTeamStatus;

  @Prop({ min: 1 })
  finalPlacement?: number;

  @Prop({ trim: true, maxlength: 300 })
  notes?: string;
}

export const TournamentTeamSchema =
  SchemaFactory.createForClass(TournamentTeam);

@Schema({ _id: false })
export class TournamentGroup {
  @Prop({ required: true, trim: true, uppercase: true })
  name!: string; // 'A', 'B', 'C' etc.

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Team' }], default: [] })
  teamIds!: Types.ObjectId[];

  @Prop({ default: 0 }) matchesPlayed!: number;
  @Prop({ default: 0 }) teamsAdvancing!: number; // how many qualify
}

@Schema({
  timestamps: true,
  collection: 'tournaments',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Tournament {
  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({ trim: true, maxlength: 1000 })
  description?: string;

  @Prop({ trim: true })
  edition?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({ type: String, enum: SportType, required: true, index: true })
  sport!: SportType;

  @Prop({
    type: String,
    enum: TournamentFormat,
    required: true,
    default: TournamentFormat.SINGLE_ELIMINATION,
  })
  format!: TournamentFormat;

  @Prop({
    type: String,
    enum: TournamentVisibility,
    default: TournamentVisibility.PUBLIC,
  })
  visibility!: TournamentVisibility;

  @Prop({ required: true, min: 2 })
  maxTeams!: number;

  @Prop({ default: 0 })
  registeredTeams!: number;

  @Prop({ index: true })
  registrationStartDate?: Date;

  @Prop({ index: true })
  registrationEndDate?: Date;

  @Prop({ required: true, index: true })
  startDate!: Date;

  @Prop()
  endDate?: Date;

  @Prop({ type: TournamentVenue, default: {} })
  venue!: TournamentVenue;

  @Prop({ type: TournamentPrize, default: {} })
  prize!: TournamentPrize;

  @Prop({ type: TournamentContact, default: {} })
  contact!: TournamentContact;

  @Prop({ trim: true, maxlength: 5000 })
  rules?: string;

  @Prop({ default: 0 }) numberOfGroups!: number;
  @Prop({ default: 2 }) teamsAdvancingPerGroup!: number;

  @Prop({ type: [TournamentTeamSchema], default: [] })
  teams!: TournamentTeam[];

  @Prop({ type: [TournamentGroup], default: [] })
  groups!: TournamentGroup[];

  @Prop({
    type: String,
    enum: TournamentStatus,
    default: TournamentStatus.DRAFT,
    index: true,
  })
  status!: TournamentStatus;

  @Prop({ type: Types.ObjectId, ref: 'Team' })
  winnerId?: Types.ObjectId;

  @Prop({ trim: true })
  winnerName?: string;

  @Prop({ type: Types.ObjectId, ref: 'Team' })
  runnerUpId?: Types.ObjectId;

  @Prop({ trim: true })
  runnerUpName?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const TournamentSchema = SchemaFactory.createForClass(Tournament);

TournamentSchema.virtual('isRegistrationOpen').get(function (
  this: TournamentDocument,
) {
  const now = new Date();
  return (
    this.status === TournamentStatus.PUBLISHED &&
    (!this.registrationStartDate || this.registrationStartDate <= now) &&
    (!this.registrationEndDate || this.registrationEndDate >= now) &&
    this.registeredTeams < this.maxTeams
  );
});

TournamentSchema.virtual('isFull').get(function (this: TournamentDocument) {
  return this.registeredTeams >= this.maxTeams;
});

TournamentSchema.virtual('availableSlots').get(function (
  this: TournamentDocument,
) {
  return Math.max(0, this.maxTeams - this.registeredTeams);
});

// Indexes
TournamentSchema.index({ organizationId: 1, status: 1 });
TournamentSchema.index({ organizationId: 1, sport: 1 });
TournamentSchema.index({ organizationId: 1, startDate: -1 });
TournamentSchema.index({ sport: 1, format: 1 });
TournamentSchema.index({ startDate: -1 });
TournamentSchema.index({ 'teams.teamId': 1 });
