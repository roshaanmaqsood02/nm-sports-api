import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  StaffStatus,
  OrgAccessType,
  StaffResource,
  ResourcePermission,
} from '../enums/staff.enum';

export type StaffDocument = Staff & Document;

@Schema({ _id: false })
export class ResourcePermissionEntry {
  @Prop({
    type: String,
    enum: StaffResource,
    required: true,
  })
  resource!: StaffResource;

  @Prop({ default: false })
  enabled!: boolean;

  @Prop({
    type: [String],
    enum: ResourcePermission,
    default: [],
  })
  permissions!: ResourcePermission[];

  @Prop({ type: [{ type: Types.ObjectId }], default: [] })
  resourceIds!: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  resourceNames!: string[];
}

@Schema({ _id: false })
export class StaffInvitation {
  @Prop({ trim: true })
  token?: string;

  @Prop()
  sentAt?: Date;

  @Prop()
  expiresAt?: Date;

  @Prop()
  acceptedAt?: Date;

  @Prop({ default: false })
  accepted!: boolean;
}

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

  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId?: Types.ObjectId;

  @Prop({ trim: true, maxlength: 100 })
  role?: string;

  @Prop({
    type: String,
    enum: OrgAccessType,
    default: OrgAccessType.NO_ACCESS,
    index: true,
  })
  orgAccess!: OrgAccessType;

  @Prop({
    type: [ResourcePermissionEntry],
    default: [],
  })
  resourcePermissions!: ResourcePermissionEntry[];

  @Prop({ type: StaffInvitation, default: {} })
  invitation!: StaffInvitation;

  @Prop({
    type: String,
    enum: StaffStatus,
    default: StaffStatus.PENDING,
    index: true,
  })
  status!: StaffStatus;

  @Prop({ trim: true, maxlength: 500 })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);

StaffSchema.virtual('fullName').get(function (this: StaffDocument) {
  return `${this.firstName} ${this.lastName}`;
});

StaffSchema.virtual('hasOrgAccess').get(function (this: StaffDocument) {
  return this.orgAccess !== OrgAccessType.NO_ACCESS;
});

StaffSchema.virtual('isFullAccess').get(function (this: StaffDocument) {
  return this.orgAccess === OrgAccessType.FULL_ACCESS;
});

// Indexes
StaffSchema.index({ organizationId: 1, email: 1 }, { unique: true });
StaffSchema.index({ organizationId: 1, status: 1 });
StaffSchema.index({ organizationId: 1, orgAccess: 1 });
StaffSchema.index({ userId: 1 });
StaffSchema.index({ createdAt: -1 });
