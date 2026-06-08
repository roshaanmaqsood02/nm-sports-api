import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ExportFormat, ExportStatus } from '../enums/export.enum';

export type ExportLogDocument = ExportLog & Document;

@Schema({
  timestamps: true,
  collection: 'export_logs',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class ExportLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  requestedBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', index: true })
  organizationId?: Types.ObjectId;

  // Club or League ID
  @Prop({ type: Types.ObjectId, index: true })
  clubOrLeagueId?: Types.ObjectId;

  @Prop({ trim: true })
  clubOrLeagueName?: string;

  // Season info
  @Prop({ trim: true })
  season?: string;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop({ type: String, enum: ExportFormat, required: true })
  format!: ExportFormat;

  @Prop({ type: String, enum: ExportStatus, default: ExportStatus.PENDING })
  status!: ExportStatus;

  // Total records exported
  @Prop({ default: 0 })
  totalRecords!: number;

  // File info
  @Prop({ trim: true })
  fileName?: string;

  @Prop({ trim: true })
  filePath?: string;

  @Prop({ trim: true })
  fileSize?: string;

  // Error if failed
  @Prop({ trim: true })
  errorMessage?: string;

  @Prop()
  completedAt?: Date;

  // Auto-delete logs after 30 days
  @Prop({ default: Date.now })
  createdAt!: Date;
}

export const ExportLogSchema = SchemaFactory.createForClass(ExportLog);

ExportLogSchema.index({ requestedBy: 1, createdAt: -1 });
ExportLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 },
);
