import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TournamentStandingDocument = TournamentStanding & Document;

@Schema({
  timestamps: true,
  collection: 'tournament_standings',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class TournamentStanding {
  @Prop({
    type: Types.ObjectId,
    ref: 'Tournament',
    required: true,
    index: true,
  })
  tournamentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Team', required: true, index: true })
  teamId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  teamName!: string;

  @Prop({ trim: true })
  teamAbbreviation?: string;

  @Prop({ trim: true, uppercase: true, index: true })
  group?: string;

  @Prop({ default: 0 }) played!: number;
  @Prop({ default: 0 }) won!: number;
  @Prop({ default: 0 }) drawn!: number;
  @Prop({ default: 0 }) lost!: number;

  @Prop({ default: 0 }) points!: number;

  @Prop({ default: 0 }) goalsFor!: number;

  @Prop({ default: 0 }) goalsAgainst!: number;

  @Prop({ default: 0, index: true }) position!: number;

  @Prop({ default: false }) advanced!: boolean;
  @Prop({ default: false }) eliminated!: boolean;

  @Prop({ type: [String], default: [] })
  form!: string[];
}

export const TournamentStandingSchema =
  SchemaFactory.createForClass(TournamentStanding);

// Virtuals
TournamentStandingSchema.virtual('goalDifference').get(function (
  this: TournamentStandingDocument,
) {
  return this.goalsFor - this.goalsAgainst;
});

TournamentStandingSchema.virtual('winPercentage').get(function (
  this: TournamentStandingDocument,
) {
  return this.played > 0 ? +((this.won / this.played) * 100).toFixed(1) : 0;
});

TournamentStandingSchema.index(
  { tournamentId: 1, teamId: 1 },
  { unique: true },
);
TournamentStandingSchema.index({ tournamentId: 1, group: 1, points: -1 });
TournamentStandingSchema.index({ tournamentId: 1, position: 1 });
