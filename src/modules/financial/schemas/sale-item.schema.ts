import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SaleItemPriceOption } from '../enums/financial.enum';

export type SaleItemDocument = SaleItem & Document;

@Schema({ _id: true })
export class SaleItemVariation {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: 0 })
  priceAdjustment!: number;

  @Prop({ trim: true })
  sku?: string;

  @Prop({ required: false, default: 0 })
  sold?: number;

  @Prop({ default: true })
  isActive!: boolean;
}
export const SaleItemVariationSchema =
  SchemaFactory.createForClass(SaleItemVariation);

@Schema({
  timestamps: true,
  collection: 'sale_items',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class SaleItem {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({ trim: true, maxlength: 1000 })
  description?: string;

  @Prop({ required: true, default: 0 })
  price!: number;

  @Prop({
    type: String,
    enum: SaleItemPriceOption,
    default: SaleItemPriceOption.FULL_PRICE_UP_FRONT,
  })
  priceOption!: SaleItemPriceOption;

  @Prop({ default: 0 })
  upfrontAmount!: number;

  @Prop({ trim: true, index: true })
  sku?: string;

  @Prop({ type: [SaleItemVariationSchema], default: [] })
  variations!: SaleItemVariation[];

  @Prop({ default: 0 })
  totalSold!: number;

  @Prop({ default: 0 })
  totalRevenue!: number;

  @Prop({ default: true, index: true })
  isActive!: boolean;

  @Prop({ default: false })
  hasInventoryLimit!: boolean;

  @Prop({ default: 0 })
  inventoryLimit!: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const SaleItemSchema = SchemaFactory.createForClass(SaleItem);

SaleItemSchema.virtual('variationCount').get(function (this: SaleItemDocument) {
  return this.variations.filter((v) => v.isActive).length;
});

SaleItemSchema.virtual('isAvailable').get(function (this: SaleItemDocument) {
  if (!this.isActive) return false;
  if (!this.hasInventoryLimit) return true;
  return this.totalSold < this.inventoryLimit;
});

// Indexes
SaleItemSchema.index({ organizationId: 1, isActive: 1 });
SaleItemSchema.index({ organizationId: 1, name: 1 });
SaleItemSchema.index({ sku: 1 });
