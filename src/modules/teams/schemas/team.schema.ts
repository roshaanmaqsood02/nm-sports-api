import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SportType } from '../../organizations/enums/organization.enum';
import { TeamStatus, TeamGender, TeamType } from '../enums/team.enum';

export type TeamDocument = Team & Document;

// ─── Embedded: Logo ───────────────────────────────────────────────────────────
@Schema({ _id: false })
export class TeamLogo {
  @Prop({ trim: true }) filename?: string;
  @Prop({ trim: true }) url?: string;
  @Prop({ trim: true }) path?: string;
  @Prop() size?: number;
  @Prop() width?: number;
  @Prop() height?: number;
}

// ─── Main Team Schema ─────────────────────────────────────────────────────────
@Schema({
  timestamps: true,
  collection: 'teams',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Team {
  // ── Identity ─────────────────────────────────────────────────
  // Full name e.g. 'Lahore Lions Cricket Club'
  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  name!: string;

  // Short name e.g. 'Lahore Lions'
  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  shortName!: string;

  // Abbreviation / code e.g. 'LLC' (max 8 chars, uppercase)
  @Prop({
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 8,
    index: true,
  })
  abbreviation!: string;

  // ── Sport ────────────────────────────────────────────────────
  @Prop({
    type: String,
    enum: SportType,
    required: true,
    index: true,
  })
  sport!: SportType;

  // ── Gender ───────────────────────────────────────────────────
  @Prop({
    type: String,
    enum: TeamGender,
    required: true,
  })
  gender!: TeamGender;

  // ── Club or League ───────────────────────────────────────────
  @Prop({
    type: String,
    enum: TeamType,
    required: true,
    default: TeamType.CLUB,
  })
  type!: TeamType;

  // ── Season ───────────────────────────────────────────────────
  // e.g. '2024-25', '2025'
  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  season!: string;

  // Sub-season / phase e.g. 'Spring', 'Fall', 'Round 1', 'Group Stage'
  @Prop({
    trim: true,
  })
  subSeason?: string;

  // ── Organization reference ────────────────────────────────────
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  // ── Branding ─────────────────────────────────────────────────
  // Primary brand color — hex e.g. '#1A73E8'
  @Prop({
    trim: true,
    match: [
      /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      'primaryColor must be a valid hex code e.g. #1A73E8',
    ],
  })
  primaryColor?: string;

  // Secondary brand color
  @Prop({
    trim: true,
    match: [
      /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      'secondaryColor must be a valid hex code',
    ],
  })
  secondaryColor?: string;

  // ── Logo ─────────────────────────────────────────────────────
  @Prop({ type: TeamLogo })
  logo?: TeamLogo;

  // ── Status ───────────────────────────────────────────────────
  @Prop({
    type: String,
    enum: TeamStatus,
    default: TeamStatus.ACTIVE,
    index: true,
  })
  status!: TeamStatus;

  // ── Ownership ────────────────────────────────────────────────
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  createdBy!: Types.ObjectId;

  // ── Soft Delete ───────────────────────────────────────────────
  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const TeamSchema = SchemaFactory.createForClass(Team);

// ─── Indexes ──────────────────────────────────────────────────────────────────
TeamSchema.index({ name: 1, organizationId: 1, isDeleted: 1 });
TeamSchema.index({ abbreviation: 1, organizationId: 1 });
TeamSchema.index({ organizationId: 1, sport: 1, season: 1 });
TeamSchema.index({ organizationId: 1, status: 1 });
TeamSchema.index({ sport: 1, gender: 1, type: 1 });
TeamSchema.index({ season: 1, subSeason: 1 });
TeamSchema.index({ createdBy: 1, isDeleted: 1 });
TeamSchema.index({ createdAt: -1 });
