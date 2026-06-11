import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PlayerStatus } from '../enums/player.enum';

export type PlayerDocument = Player & Document;

@Schema({ _id: false })
export class OtherContact {
  @Prop({ trim: true, lowercase: true }) email?: string;
  @Prop({ trim: true }) phone?: string;
  @Prop({ trim: true }) emergencyContact?: string;
  @Prop({ trim: true }) emergencyPhone?: string;
}

export const OtherContactSchema = SchemaFactory.createForClass(OtherContact);
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
  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organization!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Team',
    required: true,
    index: true,
  })
  team!: Types.ObjectId;

  @Prop({ type: [String], required: true })
  positions!: string[];

  @Prop({ min: 0, max: 999 })
  number?: number;

  @Prop({
    type: String,
    enum: PlayerStatus,
    default: PlayerStatus.ACTIVE,
    index: true,
  })
  status!: PlayerStatus;

  @Prop({ trim: true, maxlength: 500 })
  message?: string;

  @Prop({ type: OtherContactSchema, default: {} })
  otherContact!: OtherContact;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  createdBy!: Types.ObjectId;

  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop()
  deletedAt?: Date;
}

export const PlayerSchema = SchemaFactory.createForClass(Player);

PlayerSchema.virtual('fullName').get(function (this: PlayerDocument) {
  return this.name;
});

// Indexes
PlayerSchema.index({ name: 1, organization: 1, isDeleted: 1 });
PlayerSchema.index({ team: 1, isDeleted: 1 });
PlayerSchema.index({ organization: 1, team: 1 });
PlayerSchema.index({ status: 1, isDeleted: 1 });
PlayerSchema.index({ createdBy: 1, isDeleted: 1 });
PlayerSchema.index({ createdAt: -1 });
