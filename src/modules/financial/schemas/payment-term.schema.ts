import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { InstallmentWindow, PaymentTermStatus } from '../enums/financial.enum';

export type PaymentTermDocument = PaymentTerm & Document;

@Schema({ _id: true })
export class InstallmentDefinition {
  @Prop({ required: true, min: 1 })
  installmentNumber!: number;

  @Prop({ required: false, default: 0 })
  percentage!: number;

  @Prop({ required: false, default: 0 })
  fixedAmount?: number;

  @Prop({ trim: true })
  label?: string;

  @Prop()
  specificDate?: Date;
}

export const InstallmentDefinitionSchema = SchemaFactory.createForClass(
  InstallmentDefinition,
);

@Schema({
  timestamps: true,
  collection: 'payment_terms',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class PaymentTerm {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({ trim: true, maxlength: 500 })
  description?: string;

  @Prop({ required: true, index: true })
  activeFrom!: Date;

  @Prop({ index: true })
  activeTo?: Date;

  @Prop({ required: true, min: 1, default: 1 })
  installmentCount!: number;

  @Prop({
    type: String,
    enum: InstallmentWindow,
    required: true,
  })
  installmentWindow!: InstallmentWindow;

  @Prop({ min: 1, max: 31 })
  specificDayOfMonth?: number;

  @Prop()
  specificDate?: Date;

  @Prop({ type: [InstallmentDefinitionSchema], default: [] })
  installments!: InstallmentDefinition[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'SaleItem' }], default: [] })
  appliedToSaleItems!: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  appliedToSaleItemNames!: string[];

  @Prop({
    type: String,
    enum: PaymentTermStatus,
    default: PaymentTermStatus.ACTIVE,
    index: true,
  })
  status!: PaymentTermStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const PaymentTermSchema = SchemaFactory.createForClass(PaymentTerm);

PaymentTermSchema.virtual('isCurrentlyActive').get(function (
  this: PaymentTermDocument,
) {
  const now = new Date();
  const afterStart = this.activeFrom <= now;
  const beforeEnd = !this.activeTo || this.activeTo >= now;
  return this.status === PaymentTermStatus.ACTIVE && afterStart && beforeEnd;
});

// Indexes
PaymentTermSchema.index({ organizationId: 1, status: 1 });
PaymentTermSchema.index({ organizationId: 1, activeFrom: -1 });
