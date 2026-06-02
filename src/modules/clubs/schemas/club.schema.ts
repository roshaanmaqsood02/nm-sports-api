import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SportType } from '../../organizations/enums/organization.enum';
import { ClubStatus, ClubGender } from '../enums/club.enum';

export type ClubDocument = Club & Document;

@Schema({
  timestamps: true,
  collection: 'clubs',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Club {
  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({ required: true, trim: true })
  shortName!: string;

  @Prop({
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 8,
    index: true,
  })
  abbreviation!: string;

  @Prop({ type: String, enum: ClubGender, required: true })
  gender!: ClubGender;

  @Prop({ type: String, enum: SportType, required: true, index: true })
  sport!: SportType;

  // Parent organization
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  // Optional parent division
  @Prop({ type: Types.ObjectId, ref: 'Division' })
  divisionId?: Types.ObjectId;

  // Branding
  @Prop({
    trim: true,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color'],
  })
  primaryColor?: string;

  @Prop({
    trim: true,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color'],
  })
  secondaryColor?: string;

  @Prop({
    type: String,
    enum: ClubStatus,
    default: ClubStatus.ACTIVE,
    index: true,
  })
  status!: ClubStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const ClubSchema = SchemaFactory.createForClass(Club);

ClubSchema.index({ name: 1, organizationId: 1 });
ClubSchema.index({ abbreviation: 1, organizationId: 1 });
ClubSchema.index({ organizationId: 1, sport: 1 });
ClubSchema.index({ organizationId: 1, status: 1 });
ClubSchema.index({ divisionId: 1 });
ClubSchema.index({ createdAt: -1 });
