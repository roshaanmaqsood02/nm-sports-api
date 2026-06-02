import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PlayerStatus } from '../enums/player.enum';

export type PlayerDocument = Player & Document;

// ─── Embedded: Other Contact ──────────────────────────────────────────────────
@Schema({ _id: false })
export class OtherContact {
  @Prop({ trim: true, lowercase: true }) email?: string;
  @Prop({ trim: true }) phone?: string;
  @Prop({ trim: true }) emergencyContact?: string;
  @Prop({ trim: true }) emergencyPhone?: string;
}

export const OtherContactSchema = SchemaFactory.createForClass(OtherContact);

// ─── Main Player Schema ───────────────────────────────────────────────────────
@Schema({
  timestamps: true,
  collection: 'players',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Player {
  // ── Identity ─────────────────────────────────────────────────
  @Prop({ required: true, trim: true, index: true })
  name!: string; // Combined name (e.g., 'Babar Azam')

  // ── Organization reference ────────────────────────────────────
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organization!: Types.ObjectId;

  // ── Team reference ─────────────────────────────────────────────
  @Prop({
    type: Types.ObjectId,
    ref: 'Team',
    required: true,
    index: true,
  })
  team!: Types.ObjectId;

  // ── Positions ──────────────────────────────────────────────────
  @Prop({ type: [String], required: true })
  positions!: string[]; // e.g., ['Opening Batsman', 'Wicket Keeper']

  // ── Jersey Number ─────────────────────────────────────────────
  @Prop({ min: 0, max: 999 })
  number?: number;

  // ── Status ─────────────────────────────────────────────────────
  @Prop({
    type: String,
    enum: PlayerStatus,
    default: PlayerStatus.ACTIVE,
    index: true,
  })
  status!: PlayerStatus;

  // ── Message ────────────────────────────────────────────────────
  @Prop({ trim: true, maxlength: 500 })
  message?: string;

  // ── Other Contact ─────────────────────────────────────────────
  @Prop({ type: OtherContactSchema, default: {} })
  otherContact!: OtherContact;

  // ── Ownership ──────────────────────────────────────────────────
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  createdBy!: Types.ObjectId;

  // ── Soft Delete ────────────────────────────────────────────────
  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop()
  deletedAt?: Date;
}

export const PlayerSchema = SchemaFactory.createForClass(Player);

// ─── Virtual: full name ───────────────────────────────────────────────────────
PlayerSchema.virtual('fullName').get(function (this: PlayerDocument) {
  return this.name;
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
PlayerSchema.index({ name: 1, organization: 1, isDeleted: 1 });
PlayerSchema.index({ team: 1, isDeleted: 1 });
PlayerSchema.index({ organization: 1, team: 1 });
PlayerSchema.index({ status: 1, isDeleted: 1 });
PlayerSchema.index({ createdBy: 1, isDeleted: 1 });
PlayerSchema.index({ createdAt: -1 });
