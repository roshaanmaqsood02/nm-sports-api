import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  WebsiteStatus,
  WebsiteTemplateCategory,
  WebsiteTemplateType,
} from '../enums/website.enum';

export type WebsiteDocument = Website & Document;

@Schema({ _id: false })
export class TemplateInfo {
  @Prop({ trim: true })
  templateId?: string;

  @Prop({ trim: true })
  templateName?: string;

  @Prop({ type: String, enum: WebsiteTemplateType })
  templateType?: WebsiteTemplateType;

  @Prop({ trim: true })
  previewUrl?: string;

  @Prop({ trim: true })
  thumbnailUrl?: string;
}

@Schema({
  timestamps: true,
  collection: 'websites',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Website {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: WebsiteTemplateCategory,
    required: true,
    index: true,
  })
  category!: WebsiteTemplateCategory;

  @Prop({ type: TemplateInfo, default: {} })
  template!: TemplateInfo;

  @Prop({ trim: true })
  websiteTitle?: string;

  @Prop({ trim: true, lowercase: true })
  subdomain?: string;

  @Prop({ trim: true })
  customDomain?: string;

  @Prop({ trim: true, maxlength: 1000 })
  description?: string;

  @Prop({
    type: String,
    enum: WebsiteStatus,
    default: WebsiteStatus.PENDING,
    index: true,
  })
  status!: WebsiteStatus;

  @Prop()
  activatedAt?: Date;
  @Prop()
  cancelledAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const WebsiteSchema = SchemaFactory.createForClass(Website);

WebsiteSchema.index({ organizationId: 1, status: 1 });
WebsiteSchema.index({ category: 1, status: 1 });
WebsiteSchema.index({ createdAt: -1 });
