import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { GameStatus, GameType, GameVisibility } from '../enums/game.enum';

export type GameDocument = Game & Document;

// ─── Embedded: Venue ─────────────────────────────────────────────────────────
@Schema({ _id: false })
export class GameVenue {
  @Prop({ required: true, trim: true })
  name!: string; // e.g. Sinclair Community College

  @Prop({ trim: true })
  street?: string; // e.g. West Third Street

  @Prop({ trim: true })
  city?: string; // e.g. Dayton

  @Prop({ trim: true })
  state?: string; // e.g. OH

  @Prop({ trim: true })
  country?: string; // e.g. USA

  @Prop({ trim: true })
  zip?: string;

  // Full address string (auto-composed or user-provided)
  @Prop({ trim: true })
  fullAddress?: string; // e.g. Sinclair Community College, West Third Street, Dayton, OH, USA

  // Map coordinates
  @Prop() lat?: number;
  @Prop() lng?: number;
}

// ─── Embedded: Game Time ─────────────────────────────────────────────────────
@Schema({ _id: false })
export class GameTime {
  // Display format: "3:00 PM - 5:00 PM EDT"
  @Prop({ required: true })
  startTime!: string; // e.g. "3:00 PM"

  @Prop()
  endTime?: string; // e.g. "5:00 PM"

  @Prop({ trim: true })
  timezone!: string; // e.g. "EDT", "America/New_York"

  // Formatted display string
  @Prop({ trim: true })
  displayTime?: string; // e.g. "3:00 PM - 5:00 PM EDT"

  // Duration in minutes
  @Prop({ min: 0 })
  durationMinutes?: number;

  @Prop({ trim: true })
  durationDisplay?: string; // e.g. "2 hours", "90 minutes"
}

// ─── Embedded: Opponent ──────────────────────────────────────────────────────
@Schema({ _id: true })
export class GameOpponent {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  abbreviation?: string;

  @Prop({ trim: true })
  logoUrl?: string;

  @Prop({ trim: true })
  contactEmail?: string;

  @Prop({ trim: true })
  contactPhone?: string;

  @Prop({ trim: true })
  notes?: string;
}

export const GameOpponentSchema = SchemaFactory.createForClass(GameOpponent);

// ─── Main Game Schema ─────────────────────────────────────────────────────────
@Schema({
  timestamps: true,
  collection: 'games',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Game {
  // ── Identity ─────────────────────────────────────────────────
  @Prop({ required: true, trim: true, index: true })
  name!: string;

  // ── Organization & Team ───────────────────────────────────────
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Team', index: true })
  teamId?: Types.ObjectId;

  @Prop({ trim: true })
  teamName?: string;

  // ── Date & Time ───────────────────────────────────────────────
  @Prop({ required: true, index: true })
  date!: Date;

  @Prop({ type: GameTime, required: true })
  time!: GameTime;

  // ── Venue ─────────────────────────────────────────────────────
  @Prop({ type: GameVenue, required: true })
  venue!: GameVenue;

  // ── Type ─────────────────────────────────────────────────────
  @Prop({
    type: String,
    enum: GameType,
    default: GameType.HOME,
  })
  gameType!: GameType;

  // ── Opponents ─────────────────────────────────────────────────
  @Prop({ type: [GameOpponentSchema], default: [] })
  opponents!: GameOpponent[];

  // ── Status ───────────────────────────────────────────────────
  @Prop({
    type: String,
    enum: GameStatus,
    default: GameStatus.SCHEDULED,
    index: true,
  })
  status!: GameStatus;

  // ── Scores (filled after game) ────────────────────────────────
  @Prop({ default: 0 }) homeScore!: number;
  @Prop({ default: 0 }) awayScore!: number;

  // ── Team Details ──────────────────────────────────────────────
  // Arrival time — e.g. "2:30 PM"
  @Prop({ trim: true })
  arrivalTime?: string;

  // Uniform detail — e.g. "White jersey, black shorts"
  @Prop({ trim: true, maxlength: 300 })
  uniformDetail?: string;

  // Notes
  @Prop({ trim: true, maxlength: 2000 })
  notes?: string;

  // ── Visibility ───────────────────────────────────────────────
  @Prop({
    type: String,
    enum: GameVisibility,
    default: GameVisibility.TEAM,
  })
  visibility!: GameVisibility;

  // ── Season / League context ───────────────────────────────────
  @Prop({ trim: true })
  season?: string;

  @Prop({ type: Types.ObjectId, ref: 'League' })
  leagueId?: Types.ObjectId;

  @Prop({ trim: true })
  leagueName?: string;

  // ── Ownership ────────────────────────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  // ── Soft Delete ───────────────────────────────────────────────
  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const GameSchema = SchemaFactory.createForClass(Game);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
GameSchema.virtual('isUpcoming').get(function (this: GameDocument) {
  return this.date > new Date() && this.status === GameStatus.SCHEDULED;
});

GameSchema.virtual('isPast').get(function (this: GameDocument) {
  return this.date < new Date();
});

GameSchema.virtual('opponentCount').get(function (this: GameDocument) {
  return this.opponents.length;
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
GameSchema.index({ organizationId: 1, date: -1 });
GameSchema.index({ organizationId: 1, status: 1 });
GameSchema.index({ teamId: 1, date: -1 });
GameSchema.index({ date: -1 });
