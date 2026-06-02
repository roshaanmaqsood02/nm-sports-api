import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AuditAction, AuditSeverity, AuditStatus } from '../enums/audit.enum';

export type AuditLogDocument = AuditLog & Document;

@Schema({
  timestamps: true,
  collection: 'audit_logs',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class AuditLog {
  // Who
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId?: Types.ObjectId;

  @Prop({ trim: true })
  userEmail?: string;

  @Prop({ trim: true })
  username?: string;

  @Prop({ trim: true })
  userRole?: string;

  //  What
  @Prop({
    required: true,
    type: String,
    enum: AuditAction,
    index: true,
  })
  action!: AuditAction;

  @Prop({ trim: true, index: true })
  resource?: string;

  @Prop({ trim: true })
  resourceId?: string;

  // Result
  @Prop({
    type: String,
    enum: AuditStatus,
    default: AuditStatus.SUCCESS,
    index: true,
  })
  status!: AuditStatus;

  @Prop({ trim: true })
  reason?: string;

  // Payload
  @Prop({ type: Object })
  oldValue?: Record<string, any>;

  @Prop({ type: Object })
  newValue?: Record<string, any>;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  // Request Info
  @Prop({ trim: true })
  ipAddress?: string;

  @Prop({ trim: true })
  userAgent?: string;

  @Prop({ trim: true })
  httpMethod?: string;

  @Prop({ trim: true })
  endpoint?: string;

  @Prop()
  duration?: number;

  //  Severity
  @Prop({
    type: String,
    enum: AuditSeverity,
    default: AuditSeverity.LOW,
    index: true,
  })
  severity!: AuditSeverity;

  @Prop({ default: false })
  isSystemGenerated!: boolean;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Compound Indexes
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });
AuditLogSchema.index({ status: 1, severity: 1 });
AuditLogSchema.index({ createdAt: -1 });

AuditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 365 },
);
