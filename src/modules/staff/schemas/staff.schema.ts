import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  StaffStatus,
  OrgAccessType,
  StaffResource,
  ResourcePermission,
} from '../enums/staff.enum';

export type StaffDocument = Staff & Document;

// ─── Embedded: Resource Permission Entry ─────────────────────────────────────
// Represents fine-grained permissions for a single resource
// e.g.  { resource: 'teams', permissions: ['view','create','edit'] }
@Schema({ _id: false })
export class ResourcePermissionEntry {
  @Prop({
    type: String,
    enum: StaffResource,
    required: true,
  })
  resource!: StaffResource;

  // Is this resource checkbox enabled at all?
  @Prop({ default: false })
  enabled!: boolean;

  // Which actions are granted on this resource
  @Prop({
    type: [String],
    enum: ResourcePermission,
    default: [],
  })
  permissions!: ResourcePermission[];

  // Optional: restrict to specific IDs within the resource
  // e.g. only these specific team IDs
  @Prop({ type: [{ type: Types.ObjectId }], default: [] })
  resourceIds!: Types.ObjectId[];

  // Human-readable labels for the IDs (stored for quick display)
  @Prop({ type: [String], default: [] })
  resourceNames!: string[];
}

// ─── Embedded: Invitation ────────────────────────────────────────────────────
@Schema({ _id: false })
export class StaffInvitation {
  @Prop({ trim: true })
  token?: string; // secure invitation token

  @Prop()
  sentAt?: Date;

  @Prop()
  expiresAt?: Date;

  @Prop()
  acceptedAt?: Date;

  @Prop({ default: false })
  accepted!: boolean;
}

// ─── Main Staff Schema ────────────────────────────────────────────────────────
@Schema({
  timestamps: true,
  collection: 'staff',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Staff {
  // ── Identity ─────────────────────────────────────────────────
  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email!: string;

  // ── Organization ref ──────────────────────────────────────────
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  // ── Linked user account (populated after invitation accepted) ─
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId?: Types.ObjectId;

  // ── Role (optional label) ─────────────────────────────────────
  // e.g. 'Head Coach', 'Team Manager', 'Analyst'
  @Prop({ trim: true, maxlength: 100 })
  role?: string;

  // ── Org Access ───────────────────────────────────────────────
  @Prop({
    type: String,
    enum: OrgAccessType,
    default: OrgAccessType.NO_ACCESS,
    index: true,
  })
  orgAccess!: OrgAccessType;

  // ── Resource Permissions ──────────────────────────────────────
  // One entry per resource (organization, teams, players, leagues)
  @Prop({
    type: [ResourcePermissionEntry],
    default: [],
  })
  resourcePermissions!: ResourcePermissionEntry[];

  // ── Invitation ───────────────────────────────────────────────
  @Prop({ type: StaffInvitation, default: {} })
  invitation!: StaffInvitation;

  // ── Status ───────────────────────────────────────────────────
  @Prop({
    type: String,
    enum: StaffStatus,
    default: StaffStatus.PENDING,
    index: true,
  })
  status!: StaffStatus;

  // ── Notes ────────────────────────────────────────────────────
  @Prop({ trim: true, maxlength: 500 })
  notes?: string;

  // ── Ownership (always superadmin) ────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  // ── Soft Delete ───────────────────────────────────────────────
  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
StaffSchema.virtual('fullName').get(function (this: StaffDocument) {
  return `${this.firstName} ${this.lastName}`;
});

StaffSchema.virtual('hasOrgAccess').get(function (this: StaffDocument) {
  return this.orgAccess !== OrgAccessType.NO_ACCESS;
});

StaffSchema.virtual('isFullAccess').get(function (this: StaffDocument) {
  return this.orgAccess === OrgAccessType.FULL_ACCESS;
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
StaffSchema.index({ organizationId: 1, email: 1 }, { unique: true });
StaffSchema.index({ organizationId: 1, status: 1 });
StaffSchema.index({ organizationId: 1, orgAccess: 1 });
StaffSchema.index({ userId: 1 });
StaffSchema.index({ createdAt: -1 });
