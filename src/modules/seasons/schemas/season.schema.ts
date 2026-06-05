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

@Schema({ _id: false })
export class CopySubseasonConfig {
  @Prop({ type: Types.ObjectId })
  sourceSubseasonId?: Types.ObjectId;

  @Prop({ trim: true })
  sourceSubseasonName?: string;

  @Prop({ trim: true })
  topDivisionPageSource?: string;

  @Prop({ trim: true })
  bottomDivisionPageSource?: string;

  @Prop({ trim: true })
  topTeamPageSource?: string;

  @Prop({ trim: true })
  bottomTeamPageSource?: string;
}

@Schema({ _id: false })
export class SeedConfig {
  @Prop({ default: false })
  enabled!: boolean;

  @Prop({ default: false })
  autoGenerate!: boolean;

  @Prop({ default: 0 })
  seedCount!: number;

  @Prop({ trim: true, maxlength: 500 })
  seedRules?: string;
}

@Schema({ _id: true, timestamps: true })
export class Subseason {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  shortName?: string;

  @Prop({ default: 0 })
  order!: number;

  @Prop({
    type: String,
    enum: DataSourceType,
    default: DataSourceType.SCRATCH,
  })
  dataSource!: DataSourceType;

  @Prop({ type: CopySubseasonConfig, default: {} })
  copyConfig!: CopySubseasonConfig;

  @Prop({
    type: String,
    enum: GameIdGeneration,
    default: GameIdGeneration.NONE,
  })
  gameIdGeneration!: GameIdGeneration;

  @Prop({ trim: true, maxlength: 20 })
  gameIdPrefix?: string;

  @Prop({ default: 1 })
  gameIdCounter!: number;

  @Prop({ type: SeedConfig, default: {} })
  seedConfig!: SeedConfig;

  @Prop({ trim: true, maxlength: 50, default: 'Game Type' })
  gameTypeTitle!: string;

  @Prop({ trim: true, maxlength: 50, default: 'Group' })
  groupNameTitle!: string;

  @Prop({
    type: String,
    enum: StaticGroupingType,
    default: StaticGroupingType.NONE,
  })
  staticGrouping!: StaticGroupingType;

  @Prop({ type: [String], default: [] })
  customGroups!: string[];

  @Prop() startDate?: Date;
  @Prop() endDate?: Date;

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
  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: SeasonType,
    required: true,
    default: SeasonType.LEAGUE,
  })
  type!: SeasonType;

  @Prop({ type: Types.ObjectId, index: true })
  clubOrLeagueId?: Types.ObjectId;

  @Prop({ trim: true })
  clubOrLeagueName?: string;

  @Prop({
    type: String,
    enum: StaticGroupingType,
    default: StaticGroupingType.NONE,
  })
  staticGrouping!: StaticGroupingType;

  @Prop({ type: [SubseasonSchema], default: [] })
  subseasons!: Subseason[];

  @Prop() startDate?: Date;
  @Prop() endDate?: Date;

  @Prop({
    type: String,
    enum: SeasonStatus,
    default: SeasonStatus.DRAFT,
    index: true,
  })
  status!: SeasonStatus;

  @Prop({ trim: true, maxlength: 1000 })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const SeasonSchema = SchemaFactory.createForClass(Season);

SeasonSchema.virtual('subseasonCount').get(function (this: SeasonDocument) {
  return this.subseasons?.length ?? 0;
});

SeasonSchema.virtual('activeSubseason').get(function (this: SeasonDocument) {
  return this.subseasons?.find((s) => s.status === SubseasonStatus.ACTIVE);
});

// Indexes
SeasonSchema.index({ organizationId: 1, name: 1 });
SeasonSchema.index({ organizationId: 1, status: 1 });
SeasonSchema.index({ organizationId: 1, type: 1 });
SeasonSchema.index({ clubOrLeagueId: 1 });
SeasonSchema.index({ createdAt: -1 });
