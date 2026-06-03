import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BracketRound, BracketMatchStatus } from '../enums/tournament.enum';

export type BracketDocument = Bracket & Document;

// Embedded: Bracket Team Entry
@Schema({ _id: false })
export class BracketTeamEntry {
  @Prop({ type: Types.ObjectId, ref: 'Team' })
  teamId?: Types.ObjectId;

  @Prop({ trim: true })
  teamName?: string;

  @Prop({ trim: true })
  teamAbbreviation?: string;

  @Prop({ default: 0 }) score!: number;

  @Prop({ default: false }) isWinner!: boolean;
  @Prop({ default: false }) isBye!: boolean;
}

// Main Bracket Schema
@Schema({
  timestamps: true,
  collection: 'brackets',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Bracket {
  @Prop({
    type: Types.ObjectId,
    ref: 'Tournament',
    required: true,
    index: true,
  })
  tournamentId!: Types.ObjectId;

  // Round info
  @Prop({ type: String, enum: BracketRound, required: true, index: true })
  round!: BracketRound;

  @Prop({ trim: true })
  roundLabel?: string;

  @Prop({ required: true, min: 1, index: true })
  roundNumber!: number;

  @Prop({ required: true, min: 1 })
  matchNumber!: number;

  @Prop({ trim: true, uppercase: true })
  group?: string;

  @Prop({ type: BracketTeamEntry, default: {} })
  teamA!: BracketTeamEntry;

  @Prop({ type: BracketTeamEntry, default: {} })
  teamB!: BracketTeamEntry;

  @Prop({ type: Types.ObjectId, ref: 'Team' })
  winnerId?: Types.ObjectId;

  @Prop({ trim: true })
  winnerName?: string;

  @Prop({ type: Types.ObjectId, ref: 'Match' })
  matchId?: Types.ObjectId;

  @Prop({ index: true })
  scheduledAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Bracket' })
  nextMatchId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Bracket' })
  loserNextMatchId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: BracketMatchStatus,
    default: BracketMatchStatus.PENDING,
    index: true,
  })
  status!: BracketMatchStatus;

  @Prop({ trim: true })
  notes?: string;
}

export const BracketSchema = SchemaFactory.createForClass(Bracket);

BracketSchema.index({ tournamentId: 1, roundNumber: 1, matchNumber: 1 });
BracketSchema.index({ tournamentId: 1, round: 1 });
BracketSchema.index({ tournamentId: 1, group: 1 });
BracketSchema.index({ tournamentId: 1, status: 1 });
