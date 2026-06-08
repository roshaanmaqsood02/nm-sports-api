import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  PowerRankingStatus,
  RankChangeDirection,
} from '../enums/power-ranking.enum';

export type PowerRankingDocument = PowerRanking & Document;

@Schema({ _id: true })
export class RankedTeam {
  // Rank position e.g. 1, 2, 3
  @Prop({ required: true, min: 1 })
  rank!: number;

  // Team reference (optional — can be a free-text team name)
  @Prop({ type: Types.ObjectId, ref: 'Team' })
  teamId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  teamName!: string;

  @Prop({ trim: true })
  teamAbbreviation?: string;

  @Prop({ trim: true })
  teamLogo?: string;

  // Previous rank (for change tracking)
  @Prop()
  previousRank?: number;

  // Up / Down / Same / New / Dropped
  @Prop({
    type: String,
    enum: RankChangeDirection,
    default: RankChangeDirection.NEW,
  })
  changeDirection!: RankChangeDirection;

  // How many positions changed e.g. +2, -1
  @Prop({ default: 0 })
  changeAmount!: number;

  // Win-Loss record e.g. '12-3'
  @Prop({ trim: true })
  record?: string;

  // Points or rating value
  @Prop({ default: 0 })
  points!: number;

  // Short analyst note for this team
  @Prop({ trim: true, maxlength: 300 })
  notes?: string;

  @Prop({ default: true })
  isActive!: boolean;
}

export const RankedTeamSchema = SchemaFactory.createForClass(RankedTeam);

@Schema({
  timestamps: true,
  collection: 'power_rankings',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class PowerRanking {
  @Prop({ required: true, trim: true, index: true })
  title!: string;

  @Prop({ required: true, trim: true })
  label!: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'League', index: true })
  leagueId?: Types.ObjectId;

  @Prop({ trim: true })
  leagueName?: string;

  @Prop({ type: Types.ObjectId, index: true })
  subseasonId?: Types.ObjectId;

  @Prop({ trim: true })
  subseasonName?: string;

  @Prop({ type: [RankedTeamSchema], default: [] })
  rankings!: RankedTeam[];

  @Prop({
    type: String,
    enum: PowerRankingStatus,
    default: PowerRankingStatus.DRAFT,
    index: true,
  })
  status!: PowerRankingStatus;

  @Prop()
  publishedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const PowerRankingSchema = SchemaFactory.createForClass(PowerRanking);

PowerRankingSchema.virtual('totalTeams').get(function (
  this: PowerRankingDocument,
) {
  return this.rankings.filter((r) => r.isActive).length;
});

// Indexes
PowerRankingSchema.index({ organizationId: 1, status: 1 });
PowerRankingSchema.index({ organizationId: 1, leagueId: 1 });
PowerRankingSchema.index({ organizationId: 1, subseasonId: 1 });
PowerRankingSchema.index({ leagueId: 1, subseasonId: 1 });
PowerRankingSchema.index({ createdAt: -1 });
