import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SportType } from '../../organizations/enums/organization.enum';
import {
  MatchStatus,
  MatchType,
  MatchEventType,
  MatchResultType,
  MatchVenueType,
} from '../enums/match.enum';

export type MatchDocument = Match & Document;

// ─── Embedded: Team Score ─────────────────────────────────────────────────────
@Schema({ _id: false })
export class TeamScore {
  @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
  teamId!: Types.ObjectId;

  @Prop({ trim: true })
  teamName!: string;

  @Prop({ trim: true })
  teamAcronym?: string;

  // ── Score fields (sport-specific) ──────────────────────────
  @Prop({ default: 0 }) score!: number; // goals/points/runs

  // Football extras
  @Prop({ default: 0 }) penaltyScore!: number;
  @Prop({ default: 0 }) halfTimeScore!: number;

  // Cricket extras
  @Prop({ default: 0 }) wickets!: number;
  @Prop({ default: 0 }) overs!: number;
  @Prop({ default: 0 }) extras!: number;
  @Prop({ trim: true }) inningsSummary?: string; // e.g. '245/6 (45.2 ov)'

  // Basketball extras
  @Prop({ default: 0 }) q1Score!: number;
  @Prop({ default: 0 }) q2Score!: number;
  @Prop({ default: 0 }) q3Score!: number;
  @Prop({ default: 0 }) q4Score!: number;
  @Prop({ default: 0 }) overtimeScore!: number;

  // Universal
  @Prop({ default: 0 }) fouls!: number;
  @Prop({ default: 0 }) yellowCards!: number;
  @Prop({ default: 0 }) redCards!: number;
}

// ─── Embedded: Match Event (timeline) ────────────────────────────────────────
@Schema({ _id: true, timestamps: { createdAt: true, updatedAt: false } })
export class MatchEvent {
  @Prop({
    required: true,
    type: String,
    enum: MatchEventType,
  })
  eventType!: MatchEventType;

  // Minute of match e.g. 45, 90+3
  @Prop({ trim: true })
  minute?: string;

  // Player involved
  @Prop({ type: Types.ObjectId, ref: 'Player' })
  playerId?: Types.ObjectId;

  @Prop({ trim: true })
  playerName?: string;

  // Secondary player (assist, substitution-in)
  @Prop({ type: Types.ObjectId, ref: 'Player' })
  secondaryPlayerId?: Types.ObjectId;

  @Prop({ trim: true })
  secondaryPlayerName?: string;

  // Which team the event belongs to
  @Prop({ type: Types.ObjectId, ref: 'Team' })
  teamId?: Types.ObjectId;

  @Prop({ trim: true })
  teamName?: string;

  @Prop({ trim: true, maxlength: 300 })
  description?: string;

  // Score snapshot AT this event
  @Prop({ trim: true })
  scoreSnapshot?: string; // e.g. '2-1'
}

export const MatchEventSchema = SchemaFactory.createForClass(MatchEvent);

// ─── Embedded: Player Performance (per-match stats) ──────────────────────────
@Schema({ _id: true })
export class PlayerPerformance {
  @Prop({ type: Types.ObjectId, ref: 'Player', required: true })
  playerId!: Types.ObjectId;

  @Prop({ trim: true })
  playerName!: string;

  @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
  teamId!: Types.ObjectId;

  @Prop({ default: false }) started!: boolean;
  @Prop({ default: false }) played!: boolean;

  // Universal
  @Prop({ default: 0 }) minutesPlayed!: number;
  @Prop({ default: 0 }) goals!: number;
  @Prop({ default: 0 }) assists!: number;
  @Prop({ default: 0 }) yellowCards!: number;
  @Prop({ default: 0 }) redCards!: number;
  @Prop({ default: 0 }) rating?: number; // 0-10

  // Cricket
  @Prop({ default: 0 }) runsScored!: number;
  @Prop({ default: 0 }) ballsFaced!: number;
  @Prop({ default: 0 }) wicketsTaken!: number;
  @Prop({ default: 0 }) oversBowled!: number;
  @Prop({ default: 0 }) catches!: number;

  // Basketball
  @Prop({ default: 0 }) points!: number;
  @Prop({ default: 0 }) rebounds!: number;
  @Prop({ default: 0 }) blocks!: number;
  @Prop({ default: 0 }) steals!: number;

  @Prop({ trim: true, maxlength: 300 })
  notes?: string;
}

export const PlayerPerformanceSchema =
  SchemaFactory.createForClass(PlayerPerformance);

// ─── Embedded: Venue ─────────────────────────────────────────────────────────
@Schema({ _id: false })
export class MatchVenue {
  @Prop({ trim: true })
  name?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  country?: string;

  @Prop({ type: String, enum: MatchVenueType, default: MatchVenueType.NEUTRAL })
  type!: MatchVenueType;

  @Prop()
  capacity?: number;
}

// ─── Embedded: Officials ─────────────────────────────────────────────────────
@Schema({ _id: false })
export class MatchOfficials {
  @Prop({ trim: true }) referee?: string;
  @Prop({ trim: true }) assistantReferee1?: string;
  @Prop({ trim: true }) assistantReferee2?: string;
  @Prop({ trim: true }) fourthOfficial?: string;
  @Prop({ trim: true }) umpire1?: string;
  @Prop({ trim: true }) umpire2?: string;
}

// ─── Embedded: Weather ───────────────────────────────────────────────────────
@Schema({ _id: false })
export class MatchWeather {
  @Prop({ trim: true }) condition?: string; // 'Sunny', 'Rainy', 'Overcast'
  @Prop() temperatureCelsius?: number;
  @Prop({ trim: true }) windSpeed?: string;
  @Prop({ trim: true }) humidity?: string;
}

// ─── Main Match Schema ────────────────────────────────────────────────────────
@Schema({
  timestamps: true,
  collection: 'matches',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Match {
  // ── Identity ─────────────────────────────────────────────────
  @Prop({ trim: true })
  title?: string; // e.g. 'PSL Final 2025'

  @Prop({ trim: true })
  matchNumber?: string; // e.g. 'Match 42', 'QF-1'

  // ── Organization ─────────────────────────────────────────────
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  // ── Tournament reference (optional) ──────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'Tournament', index: true })
  tournamentId?: Types.ObjectId;

  // ── Sport ────────────────────────────────────────────────────
  @Prop({ type: String, enum: SportType, required: true, index: true })
  sport!: SportType;

  // ── Match Type ───────────────────────────────────────────────
  @Prop({ type: String, enum: MatchType, default: MatchType.FRIENDLY })
  matchType!: MatchType;

  // ── Teams ────────────────────────────────────────────────────
  @Prop({ type: TeamScore, required: true })
  homeTeam!: TeamScore;

  @Prop({ type: TeamScore, required: true })
  awayTeam!: TeamScore;

  // ── Schedule ─────────────────────────────────────────────────
  @Prop({ required: true, index: true })
  scheduledAt!: Date;

  @Prop()
  startedAt?: Date;

  @Prop()
  endedAt?: Date;

  // Duration in minutes
  @Prop()
  durationMinutes?: number;

  // ── Venue ────────────────────────────────────────────────────
  @Prop({ type: MatchVenue, default: {} })
  venue!: MatchVenue;

  // ── Officials ────────────────────────────────────────────────
  @Prop({ type: MatchOfficials, default: {} })
  officials!: MatchOfficials;

  // ── Weather ──────────────────────────────────────────────────
  @Prop({ type: MatchWeather, default: {} })
  weather!: MatchWeather;

  // ── Result ───────────────────────────────────────────────────
  @Prop({ type: String, enum: MatchResultType })
  result?: MatchResultType;

  @Prop({ trim: true })
  resultNotes?: string; // e.g. 'Won on penalties'

  @Prop({ default: 0 })
  attendance?: number;

  // ── Events Timeline ──────────────────────────────────────────
  @Prop({ type: [MatchEventSchema], default: [] })
  events!: MatchEvent[];

  // ── Player Performances ───────────────────────────────────────
  @Prop({ type: [PlayerPerformanceSchema], default: [] })
  performances!: PlayerPerformance[];

  // ── Status ───────────────────────────────────────────────────
  @Prop({
    type: String,
    enum: MatchStatus,
    default: MatchStatus.SCHEDULED,
    index: true,
  })
  status!: MatchStatus;

  // ── Notes ────────────────────────────────────────────────────
  @Prop({ trim: true, maxlength: 1000 })
  notes?: string;

  // ── Ownership ────────────────────────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  // ── Soft Delete ───────────────────────────────────────────────
  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const MatchSchema = SchemaFactory.createForClass(Match);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
MatchSchema.virtual('scoreline').get(function (this: MatchDocument) {
  if (!this.homeTeam || !this.awayTeam) return null;
  return `${this.homeTeam.teamName} ${this.homeTeam.score} - ${this.awayTeam.score} ${this.awayTeam.teamName}`;
});

MatchSchema.virtual('isLive').get(function (this: MatchDocument) {
  return this.status === MatchStatus.IN_PROGRESS;
});

MatchSchema.virtual('eventCount').get(function (this: MatchDocument) {
  return this.events?.length ?? 0;
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
MatchSchema.index({ organizationId: 1, scheduledAt: -1 });
MatchSchema.index({ organizationId: 1, status: 1 });
MatchSchema.index({ 'homeTeam.teamId': 1, scheduledAt: -1 });
MatchSchema.index({ 'awayTeam.teamId': 1, scheduledAt: -1 });
MatchSchema.index({ tournamentId: 1, scheduledAt: 1 });
MatchSchema.index({ sport: 1, scheduledAt: -1 });
MatchSchema.index({ status: 1, scheduledAt: 1 });
MatchSchema.index({ scheduledAt: -1 });
