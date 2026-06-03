import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  SeasonType,
  SeasonStatus,
  DataSourceType,
  GameIdGeneration,
  StaticGroupingType,
  SubseasonStatus,
} from '../enums/season.enum';

export type SeasonDocument = Season & Document;

// ─── Embedded: Copy Subseason Config ─────────────────────────────────────────
// Used when dataSource = 'copy_subseason'
@Schema({ _id: false })
export class CopySubseasonConfig {
  // Reference to the subseason being copied from
  @Prop({ type: Types.ObjectId })
  sourceSubseasonId?: Types.ObjectId;

  @Prop({ trim: true })
  sourceSubseasonName?: string;

  // Page source URLs for division data
  @Prop({ trim: true })
  topDivisionPageSource?: string;

  @Prop({ trim: true })
  bottomDivisionPageSource?: string;

  // Page source URLs for team data
  @Prop({ trim: true })
  topTeamPageSource?: string;

  @Prop({ trim: true })
  bottomTeamPageSource?: string;
}

// ─── Embedded: Seed Config ────────────────────────────────────────────────────
@Schema({ _id: false })
export class SeedConfig {
  // Whether seeding is enabled
  @Prop({ default: false })
  enabled!: boolean;

  // Auto-generate seeds based on rankings
  @Prop({ default: false })
  autoGenerate!: boolean;

  // Number of seeds to generate
  @Prop({ default: 0 })
  seedCount!: number;

  // Seed rules / notes
  @Prop({ trim: true, maxlength: 500 })
  seedRules?: string;
}

// ─── Embedded: Subseason ──────────────────────────────────────────────────────
@Schema({ _id: true, timestamps: true })
export class Subseason {
  // Subseason name e.g. 'Spring 2025', 'Round 1', 'Group Stage'
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  shortName?: string;

  // Display order
  @Prop({ default: 0 })
  order!: number;

  // ── Data Source ───────────────────────────────────────────────
  @Prop({
    type: String,
    enum: DataSourceType,
    default: DataSourceType.SCRATCH,
  })
  dataSource!: DataSourceType;

  // Config when dataSource = copy_subseason
  @Prop({ type: CopySubseasonConfig, default: {} })
  copyConfig!: CopySubseasonConfig;

  // ── Game ID Generation ────────────────────────────────────────
  @Prop({
    type: String,
    enum: GameIdGeneration,
    default: GameIdGeneration.NONE,
  })
  gameIdGeneration!: GameIdGeneration;

  // Prefix for auto-generated game IDs e.g. 'SPR25-'
  @Prop({ trim: true, maxlength: 20 })
  gameIdPrefix?: string;

  // Current game ID counter (for auto-generation)
  @Prop({ default: 1 })
  gameIdCounter!: number;

  // ── Seed Config ───────────────────────────────────────────────
  @Prop({ type: SeedConfig, default: {} })
  seedConfig!: SeedConfig;

  // ── Titles / Labels ───────────────────────────────────────────
  // Custom title for game type column e.g. 'Game Type', 'Match Type'
  @Prop({ trim: true, maxlength: 50, default: 'Game Type' })
  gameTypeTitle!: string;

  // Custom title for group name column e.g. 'Group', 'Pool', 'Division'
  @Prop({ trim: true, maxlength: 50, default: 'Group' })
  groupNameTitle!: string;

  // ── Static Grouping ───────────────────────────────────────────
  @Prop({
    type: String,
    enum: StaticGroupingType,
    default: StaticGroupingType.NONE,
  })
  staticGrouping!: StaticGroupingType;

  // Custom group names when staticGrouping = custom
  @Prop({ type: [String], default: [] })
  customGroups!: string[];

  // ── Schedule Dates ────────────────────────────────────────────
  @Prop() startDate?: Date;
  @Prop() endDate?: Date;

  // ── Status ───────────────────────────────────────────────────
  @Prop({
    type: String,
    enum: SubseasonStatus,
    default: SubseasonStatus.DRAFT,
  })
  status!: SubseasonStatus;

  @Prop({ trim: true, maxlength: 500 })
  notes?: string;
}

export const SubseasonSchema = SchemaFactory.createForClass(Subseason);

// ─── Main Season Schema ───────────────────────────────────────────────────────
@Schema({
  timestamps: true,
  collection: 'seasons',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Season {
  // ── Identity ─────────────────────────────────────────────────
  @Prop({ required: true, trim: true, index: true })
  name!: string;

  // ── Organization ─────────────────────────────────────────────
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  // ── Club or League ───────────────────────────────────────────
  @Prop({
    type: String,
    enum: SeasonType,
    required: true,
    default: SeasonType.LEAGUE,
  })
  type!: SeasonType;

  // Reference to Club or League document
  @Prop({ type: Types.ObjectId, index: true })
  clubOrLeagueId?: Types.ObjectId;

  @Prop({ trim: true })
  clubOrLeagueName?: string;

  // ── Static Grouping (season-level default) ────────────────────
  @Prop({
    type: String,
    enum: StaticGroupingType,
    default: StaticGroupingType.NONE,
  })
  staticGrouping!: StaticGroupingType;

  // ── Subseasons ───────────────────────────────────────────────
  @Prop({ type: [SubseasonSchema], default: [] })
  subseasons!: Subseason[];

  // ── Season Dates ─────────────────────────────────────────────
  @Prop() startDate?: Date;
  @Prop() endDate?: Date;

  // ── Status ───────────────────────────────────────────────────
  @Prop({
    type: String,
    enum: SeasonStatus,
    default: SeasonStatus.DRAFT,
    index: true,
  })
  status!: SeasonStatus;

  @Prop({ trim: true, maxlength: 1000 })
  description?: string;

  // ── Ownership ────────────────────────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  // ── Soft Delete ───────────────────────────────────────────────
  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const SeasonSchema = SchemaFactory.createForClass(Season);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
SeasonSchema.virtual('subseasonCount').get(function (this: SeasonDocument) {
  return this.subseasons?.length ?? 0;
});

SeasonSchema.virtual('activeSubseason').get(function (this: SeasonDocument) {
  return this.subseasons?.find((s) => s.status === SubseasonStatus.ACTIVE);
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
SeasonSchema.index({ organizationId: 1, name: 1 });
SeasonSchema.index({ organizationId: 1, status: 1 });
SeasonSchema.index({ organizationId: 1, type: 1 });
SeasonSchema.index({ clubOrLeagueId: 1 });
SeasonSchema.index({ createdAt: -1 });
