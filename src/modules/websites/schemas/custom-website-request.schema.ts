import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  WebsiteTemplateCategory,
  CustomWebsiteRequestStatus,
} from '../enums/website.enum';

export type CustomWebsiteRequestDocument = CustomWebsiteRequest & Document;

@Schema({
  timestamps: true,
  collection: 'custom_website_requests',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class CustomWebsiteRequest {
  @Prop({ unique: true, trim: true, index: true })
  referenceNumber!: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    index: true,
  })
  organizationId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: WebsiteTemplateCategory,
    required: true,
    index: true,
  })
  category!: WebsiteTemplateCategory;

  @Prop({ required: true, trim: true, maxlength: 3000 })
  description!: string;

  @Prop({
    type: String,
    enum: CustomWebsiteRequestStatus,
    default: CustomWebsiteRequestStatus.PENDING,
    index: true,
  })
  status!: CustomWebsiteRequestStatus;

  @Prop({ trim: true, maxlength: 2000 })
  adminNotes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  submittedBy!: Types.ObjectId;

  @Prop() reviewedAt?: Date;
  @Prop() completedAt?: Date;

  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const CustomWebsiteRequestSchema =
  SchemaFactory.createForClass(CustomWebsiteRequest);

CustomWebsiteRequestSchema.index({ organizationId: 1, status: 1 });
CustomWebsiteRequestSchema.index({ submittedBy: 1, status: 1 });
CustomWebsiteRequestSchema.index({ createdAt: -1 });
