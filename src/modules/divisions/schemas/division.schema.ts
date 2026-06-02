import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DivisionType, DivisionStatus } from '../enums/division.enum';

export type DivisionDocument = Division & Document;

@Schema({
  timestamps: true,
  collection: 'divisions',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Division {
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

  // Club or League type
  @Prop({
    type: String,
    enum: DivisionType,
    required: true,
    default: DivisionType.CLUB,
  })
  type!: DivisionType;

  // Parent organization
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

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
    enum: DivisionStatus,
    default: DivisionStatus.ACTIVE,
    index: true,
  })
  status!: DivisionStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const DivisionSchema = SchemaFactory.createForClass(Division);

DivisionSchema.index({ name: 1, organizationId: 1 });
DivisionSchema.index({ abbreviation: 1, organizationId: 1 });
DivisionSchema.index({ organizationId: 1, status: 1 });
DivisionSchema.index({ createdAt: -1 });
