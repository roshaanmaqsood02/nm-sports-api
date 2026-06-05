import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PlayerStatsDocument = PlayerStats & Document;

@Schema({
  timestamps: true,
  collection: 'league_player_stats',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class PlayerStats {
  @Prop({ type: Types.ObjectId, ref: 'League', required: true, index: true })
  leagueId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Player', required: true, index: true })
  playerId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  playerName!: string;

  @Prop({ type: Types.ObjectId, ref: 'Team', required: true, index: true })
  teamId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  teamName!: string;

  @Prop({ trim: true })
  season!: string;

  // GP  — Games Played
  @Prop({ default: 0 }) GP!: number;

  // PTS — Total Points
  @Prop({ default: 0 }) PTS!: number;

  // PPG — Points Per Game (computed)
  // FGM — Field Goals Made
  @Prop({ default: 0 }) FGM!: number;

  // FGA — Field Goals Attempted
  @Prop({ default: 0 }) FGA!: number;

  // FTM — Free Throws Made
  @Prop({ default: 0 }) FTM!: number;

  // FTA — Free Throws Attempted
  @Prop({ default: 0 }) FTA!: number;

  // 3PM — 3-Pointers Made
  @Prop({ default: 0 }) ThreePM!: number;

  // 3PA — 3-Pointers Attempted
  @Prop({ default: 0 }) ThreePA!: number;

  // HIGH — Season High Points in a single game
  @Prop({ default: 0 }) HIGH!: number;

  // REB — Total Rebounds
  @Prop({ default: 0 }) REB!: number;

  // OFF — Offensive Rebounds
  @Prop({ default: 0 }) OFF!: number;

  // DEF — Defensive Rebounds
  @Prop({ default: 0 }) DEF!: number;

  // AST — Total Assists
  @Prop({ default: 0 }) AST!: number;

  // STL — Total Steals
  @Prop({ default: 0 }) STL!: number;

  // BLK — Total Blocks
  @Prop({ default: 0 }) BLK!: number;
}

export const PlayerStatsSchema = SchemaFactory.createForClass(PlayerStats);

PlayerStatsSchema.virtual('PPG').get(function (this: PlayerStatsDocument) {
  return this.GP > 0 ? +(this.PTS / this.GP).toFixed(1) : 0;
});

PlayerStatsSchema.virtual('FGPct').get(function (this: PlayerStatsDocument) {
  return this.FGA > 0 ? +((this.FGM / this.FGA) * 100).toFixed(1) : 0;
});

PlayerStatsSchema.virtual('FTPct').get(function (this: PlayerStatsDocument) {
  return this.FTA > 0 ? +((this.FTM / this.FTA) * 100).toFixed(1) : 0;
});

PlayerStatsSchema.virtual('ThreePPct').get(function (
  this: PlayerStatsDocument,
) {
  return this.ThreePA > 0
    ? +((this.ThreePM / this.ThreePA) * 100).toFixed(1)
    : 0;
});

PlayerStatsSchema.virtual('RPG').get(function (this: PlayerStatsDocument) {
  return this.GP > 0 ? +(this.REB / this.GP).toFixed(1) : 0;
});

PlayerStatsSchema.virtual('APG').get(function (this: PlayerStatsDocument) {
  return this.GP > 0 ? +(this.AST / this.GP).toFixed(1) : 0;
});

PlayerStatsSchema.virtual('SPG').get(function (this: PlayerStatsDocument) {
  return this.GP > 0 ? +(this.STL / this.GP).toFixed(1) : 0;
});

PlayerStatsSchema.virtual('BLKPG').get(function (this: PlayerStatsDocument) {
  return this.GP > 0 ? +(this.BLK / this.GP).toFixed(1) : 0;
});

// Index
PlayerStatsSchema.index({ leagueId: 1, playerId: 1 }, { unique: true });
PlayerStatsSchema.index({ leagueId: 1, teamId: 1 });
PlayerStatsSchema.index({ leagueId: 1, PTS: -1 });
PlayerStatsSchema.index({ leagueId: 1, REB: -1 });
PlayerStatsSchema.index({ leagueId: 1, AST: -1 });
