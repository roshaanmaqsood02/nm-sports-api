import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  SportType,
  OrganizationGender,
  OrganizationStatus,
  OrgTimezone,
} from '../enums/organization.enum';

export type OrganizationDocument = Organization & Document;

// Embedded: Logo Info
@Schema({ _id: false })
export class OrgLogo {
  @Prop({ trim: true })
  filename?: string;

  @Prop({ trim: true })
  url?: string;

  @Prop({ trim: true })
  path?: string;

  @Prop()
  size?: number;

  @Prop()
  width?: number;

  @Prop()
  height?: number;
}

// Embedded: Address
@Schema({ _id: false })
export class OrgAddress {
  @Prop({ required: true, trim: true })
  address!: string;

  @Prop({ required: true, trim: true })
  city!: string;

  @Prop({ required: true, trim: true })
  state!: string;

  @Prop({ required: true, trim: true })
  country!: string;

  @Prop({ required: true, trim: true })
  zipCode!: string;
}

// Embedded: Contact
@Schema({ _id: false })
export class OrgContact {
  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  website?: string;
}

// Main Organization Schema
@Schema({
  timestamps: true,
  collection: 'organizations',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Organization {
  // Identity
  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  name!: string;

  @Prop({
    trim: true,
    uppercase: true,
    maxlength: 8,
    index: true,
  })
  acronym?: string;

  // Sports (multi-select)
  @Prop({
    type: [String],
    enum: SportType,
    default: [],
    index: true,
  })
  sports!: SportType[];

  // Location
  @Prop({ type: OrgAddress, required: true })
  location!: OrgAddress;

  // Contact
  @Prop({ type: OrgContact, default: {} })
  contact!: OrgContact;

  // Settings
  @Prop({
    type: String,
    enum: OrgTimezone,
    default: OrgTimezone.UTC,
  })
  timezone!: OrgTimezone;

  @Prop({
    type: String,
    enum: OrganizationGender,
    required: true,
  })
  gender!: OrganizationGender;

  // ── Divisions ─────────────────────────────────────────────────
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Division' }], default: [] })
  divisions!: Types.ObjectId[];

  // ── Clubs ─────────────────────────────────────────────────────
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Club' }], default: [] })
  clubs!: Types.ObjectId[];

  // Brand color — hex value e.g. '#FF5733'
  @Prop({
    trim: true,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color'],
  })
  color?: string;

  // Logo
  @Prop({ type: OrgLogo })
  logo?: OrgLogo;

  // Ownership
  // The user who created / owns this organization
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  createdBy!: Types.ObjectId;

  // Members with access to this org (for future multi-tenancy)
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  members!: Types.ObjectId[];

  // Status
  @Prop({
    type: String,
    enum: OrganizationStatus,
    default: OrganizationStatus.ACTIVE,
    index: true,
  })
  status!: OrganizationStatus;

  // Soft Delete
  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop()
  deletedAt?: Date;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);

// Indexes
OrganizationSchema.index({ name: 1, isDeleted: 1 });
OrganizationSchema.index({ acronym: 1, isDeleted: 1 });
OrganizationSchema.index({ sports: 1 });
OrganizationSchema.index({ createdBy: 1, isDeleted: 1 });
OrganizationSchema.index({ 'location.country': 1 });
OrganizationSchema.index({ status: 1, isDeleted: 1 });
OrganizationSchema.index({ createdAt: -1 });

// Virtual: member count
OrganizationSchema.virtual('memberCount').get(function (
  this: OrganizationDocument,
) {
  return this.members?.length ?? 0;
});
