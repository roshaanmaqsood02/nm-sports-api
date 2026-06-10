import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { InvoiceStatus } from '../enums/financial.enum';

export type InvoiceDocument = Invoice & Document;

@Schema({ _id: true })
export class InvoiceLineItem {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, default: 1 })
  quantity!: number;

  @Prop({ required: true, default: 0 })
  unitPrice!: number;

  @Prop({ default: 0 })
  discount?: number;

  @Prop({ default: 0 })
  total!: number;

  @Prop({ type: Types.ObjectId, ref: 'SaleItem' })
  saleItemId?: Types.ObjectId;
}

export const InvoiceLineItemSchema =
  SchemaFactory.createForClass(InvoiceLineItem);

@Schema({ _id: true })
export class PaymentScheduleEntry {
  @Prop({ required: true })
  dueDate!: Date;

  @Prop({ required: true, default: 0 })
  amount!: number;

  @Prop({ default: false })
  isPaid!: boolean;

  @Prop()
  paidAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Transaction' })
  transactionId?: Types.ObjectId;

  @Prop({ default: 1 })
  installmentNumber!: number;
}

export const PaymentScheduleEntrySchema =
  SchemaFactory.createForClass(PaymentScheduleEntry);

@Schema({
  timestamps: true,
  collection: 'invoices',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Invoice {
  @Prop({ unique: true, trim: true, index: true })
  saleNumber!: string;

  @Prop({ unique: true, trim: true, index: true })
  invoiceNumber!: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  memberId?: Types.ObjectId;

  @Prop({ trim: true })
  memberName?: string;

  @Prop({ trim: true, lowercase: true })
  memberEmail?: string;

  @Prop({ required: true, trim: true, maxlength: 500 })
  description!: string;

  @Prop({ type: [InvoiceLineItemSchema], default: [] })
  lineItems!: InvoiceLineItem[];

  @Prop({ type: Types.ObjectId, ref: 'PaymentTerm' })
  paymentTermId?: Types.ObjectId;

  @Prop({ trim: true })
  paymentTermName?: string;

  @Prop({ type: [PaymentScheduleEntrySchema], default: [] })
  paymentSchedule!: PaymentScheduleEntry[];

  @Prop({ default: 0 })
  subtotal!: number;

  @Prop({ default: 0 })
  taxAmount!: number;

  @Prop({ default: 0 })
  discountAmount!: number;

  @Prop({ default: 0 })
  total!: number;

  @Prop({ default: 0 })
  amountPaid!: number;

  @Prop({ default: 0 })
  amountDue!: number;

  @Prop({ default: 0 })
  amountOverdue!: number;

  @Prop({ required: true, index: true })
  placedAt!: Date;

  @Prop({ index: true })
  nextPaymentDate?: Date;

  @Prop()
  dueDate?: Date;

  @Prop()
  paidAt?: Date;

  @Prop({
    type: String,
    enum: InvoiceStatus,
    default: InvoiceStatus.OPEN,
    index: true,
  })
  status!: InvoiceStatus;

  @Prop({ trim: true, maxlength: 2000 })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

InvoiceSchema.virtual('isPastDue').get(function (this: InvoiceDocument) {
  return (
    this.status === InvoiceStatus.OPEN &&
    this.nextPaymentDate != null &&
    this.nextPaymentDate < new Date()
  );
});

InvoiceSchema.virtual('balance').get(function (this: InvoiceDocument) {
  return Math.max(0, this.total - this.amountPaid);
});

// Indexes
InvoiceSchema.index({ organizationId: 1, status: 1 });
InvoiceSchema.index({ organizationId: 1, placedAt: -1 });
InvoiceSchema.index({ memberId: 1, status: 1 });
InvoiceSchema.index({ nextPaymentDate: 1 });
InvoiceSchema.index({ saleNumber: 1 });
