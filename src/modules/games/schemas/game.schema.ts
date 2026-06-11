import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { GameStatus, GameType, GameVisibility } from '../enums/game.enum';

export type GameDocument = Game & Document;

@Schema({ _id: false })
export class GameVenue {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  street?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  state?: string;

  @Prop({ trim: true })
  country?: string;

  @Prop({ trim: true })
  zip?: string;

  @Prop({ trim: true })
  fullAddress?: string;

  @Prop() lat?: number;
  @Prop() lng?: number;
}

@Schema({ _id: false })
export class GameTime {
  @Prop({ required: true })
  startTime!: string;

  @Prop()
  endTime?: string;

  @Prop({ trim: true })
  timezone!: string;

  @Prop({ trim: true })
  displayTime?: string;

  @Prop({ min: 0 })
  durationMinutes?: number;

  @Prop({ trim: true })
  durationDisplay?: string;
}

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
  @Prop({ required: true, trim: true, index: true })
  name!: string;

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

  @Prop({ required: true, index: true })
  date!: Date;

  @Prop({ type: GameTime, required: true })
  time!: GameTime;

  @Prop({ type: GameVenue, required: true })
  venue!: GameVenue;

  @Prop({
    type: String,
    enum: GameType,
    default: GameType.HOME,
  })
  gameType!: GameType;

  @Prop({ type: [GameOpponentSchema], default: [] })
  opponents!: GameOpponent[];

  @Prop({
    type: String,
    enum: GameStatus,
    default: GameStatus.SCHEDULED,
    index: true,
  })
  status!: GameStatus;

  @Prop({ default: 0 }) homeScore!: number;
  @Prop({ default: 0 }) awayScore!: number;

  @Prop({ trim: true })
  arrivalTime?: string;

  @Prop({ trim: true, maxlength: 300 })
  uniformDetail?: string;

  @Prop({ trim: true, maxlength: 2000 })
  notes?: string;

  @Prop({
    type: String,
    enum: GameVisibility,
    default: GameVisibility.TEAM,
  })
  visibility!: GameVisibility;

  @Prop({ trim: true })
  season?: string;

  @Prop({ type: Types.ObjectId, ref: 'League' })
  leagueId?: Types.ObjectId;

  @Prop({ trim: true })
  leagueName?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const GameSchema = SchemaFactory.createForClass(Game);

GameSchema.virtual('isUpcoming').get(function (this: GameDocument) {
  return this.date > new Date() && this.status === GameStatus.SCHEDULED;
});

GameSchema.virtual('isPast').get(function (this: GameDocument) {
  return this.date < new Date();
});

GameSchema.virtual('opponentCount').get(function (this: GameDocument) {
  return this.opponents.length;
});

// Indexes
GameSchema.index({ organizationId: 1, date: -1 });
GameSchema.index({ organizationId: 1, status: 1 });
GameSchema.index({ teamId: 1, date: -1 });
GameSchema.index({ date: -1 });
