import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TeamStatsDocument = TeamStats & Document;

@Schema({
  timestamps: true,
  collection: 'league_team_stats',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class TeamStats {
  // ── References ────────────────────────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'League', required: true, index: true })
  leagueId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Team', required: true, index: true })
  teamId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  teamName!: string;

  @Prop({ trim: true })
  teamAbbreviation?: string;

  @Prop({ trim: true })
  season!: string;

  // ── Team Record ───────────────────────────────────────────────
  // GP — Games Played
  @Prop({ default: 0 }) GP!: number;

  // Period/Quarter wins
  @Prop({ default: 0 }) Q1Wins!: number; // Period 1 score totals
  @Prop({ default: 0 }) Q2Wins!: number; // Period 2 score totals
  @Prop({ default: 0 }) OTWins!: number; // Overtime score totals

  // Total record
  @Prop({ default: 0 }) wins!: number;
  @Prop({ default: 0 }) losses!: number;
  @Prop({ default: 0 }) draws!: number;

  // Cumulative period scores across all games
  @Prop({ default: 0 }) totalQ1Score!: number;
  @Prop({ default: 0 }) totalQ2Score!: number;
  @Prop({ default: 0 }) totalOTScore!: number;
  @Prop({ default: 0 }) totalScore!: number;

  // ── Scoring Stats ─────────────────────────────────────────────
  @Prop({ default: 0 }) PTS!: number;
  @Prop({ default: 0 }) FGM!: number;
  @Prop({ default: 0 }) FGA!: number;
  @Prop({ default: 0 }) FTM!: number;
  @Prop({ default: 0 }) FTA!: number;
  @Prop({ default: 0 }) ThreePM!: number;
  @Prop({ default: 0 }) ThreePA!: number;

  // ── Rebound Stats ─────────────────────────────────────────────
  @Prop({ default: 0 }) REB!: number;
  @Prop({ default: 0 }) OFF!: number;
  @Prop({ default: 0 }) DEF!: number;

  // ── Misc Stats ────────────────────────────────────────────────
  @Prop({ default: 0 }) AST!: number;
  @Prop({ default: 0 }) STL!: number;
  @Prop({ default: 0 }) BLK!: number;

  // ── Players in team (count) ───────────────────────────────────
  @Prop({ default: 0 }) playerCount!: number;
}

export const TeamStatsSchema = SchemaFactory.createForClass(TeamStats);

// ─── Computed virtuals ────────────────────────────────────────────────────────
TeamStatsSchema.virtual('FGPct').get(function (this: TeamStatsDocument) {
  return this.FGA > 0 ? +((this.FGM / this.FGA) * 100).toFixed(1) : 0;
});

TeamStatsSchema.virtual('FTPct').get(function (this: TeamStatsDocument) {
  return this.FTA > 0 ? +((this.FTM / this.FTA) * 100).toFixed(1) : 0;
});

TeamStatsSchema.virtual('ThreePPct').get(function (this: TeamStatsDocument) {
  return this.ThreePA > 0
    ? +((this.ThreePM / this.ThreePA) * 100).toFixed(1)
    : 0;
});

TeamStatsSchema.virtual('PPG').get(function (this: TeamStatsDocument) {
  return this.GP > 0 ? +(this.PTS / this.GP).toFixed(1) : 0;
});

TeamStatsSchema.virtual('RPG').get(function (this: TeamStatsDocument) {
  return this.GP > 0 ? +(this.REB / this.GP).toFixed(1) : 0;
});

TeamStatsSchema.virtual('APG').get(function (this: TeamStatsDocument) {
  return this.GP > 0 ? +(this.AST / this.GP).toFixed(1) : 0;
});

TeamStatsSchema.virtual('SPG').get(function (this: TeamStatsDocument) {
  return this.GP > 0 ? +(this.STL / this.GP).toFixed(1) : 0;
});

TeamStatsSchema.virtual('BLKPG').get(function (this: TeamStatsDocument) {
  return this.GP > 0 ? +(this.BLK / this.GP).toFixed(1) : 0;
});

TeamStatsSchema.virtual('record').get(function (this: TeamStatsDocument) {
  return `${this.wins}-${this.losses}${this.draws > 0 ? `-${this.draws}` : ''}`;
});

TeamStatsSchema.index({ leagueId: 1, teamId: 1 }, { unique: true });
TeamStatsSchema.index({ leagueId: 1, wins: -1 });
TeamStatsSchema.index({ leagueId: 1, PTS: -1 });
