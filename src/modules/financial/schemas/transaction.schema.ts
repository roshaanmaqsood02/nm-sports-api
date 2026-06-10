import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  TransactionType,
  TransactionStatus,
  PaymentType,
} from '../enums/financial.enum';
import { randomUUID } from 'crypto';

export type TransactionDocument = Transaction & Document;

@Schema({
  timestamps: true,
  collection: 'transactions',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Transaction {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId!: Types.ObjectId;

  @Prop({
    unique: true,
    trim: true,
    index: true,
    default: () => `TXN-${randomUUID().split('-')[0].toUpperCase()}`,
  })
  transactionId!: string;

  @Prop({ type: Types.ObjectId, ref: 'Invoice', index: true })
  invoiceId?: Types.ObjectId;

  @Prop({ trim: true })
  invoiceNumber?: string;

  @Prop({ trim: true })
  saleNumber?: string;

  @Prop({ required: true, trim: true, maxlength: 500 })
  description!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  paidById?: Types.ObjectId;

  @Prop({ trim: true })
  paidByName?: string;

  @Prop({ trim: true, lowercase: true })
  paidByEmail?: string;

  @Prop({
    type: String,
    enum: PaymentType,
    default: PaymentType.ONLINE,
  })
  paymentType!: PaymentType;

  @Prop({ trim: true })
  paymentIdentifier?: string;

  @Prop({ required: true, default: 0 })
  amount!: number;

  @Prop({ default: 0 })
  feeAmount!: number;

  @Prop({ default: 0 })
  netAmount!: number;

  @Prop({
    type: String,
    enum: TransactionType,
    default: TransactionType.PAYMENT,
    index: true,
  })
  type!: TransactionType;

  @Prop({
    type: String,
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
    index: true,
  })
  status!: TransactionStatus;

  @Prop({ required: true, default: Date.now, index: true })
  transactionDate!: Date;

  @Prop({ trim: true, maxlength: 1000 })
  notes?: string;

  @Prop({ type: Types.ObjectId })
  installmentId?: Types.ObjectId;

  @Prop({ default: 0 })
  installmentNumber?: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Indexes
TransactionSchema.index({ organizationId: 1, transactionDate: -1 });
TransactionSchema.index({ organizationId: 1, status: 1 });
TransactionSchema.index({ organizationId: 1, type: 1 });
TransactionSchema.index({ invoiceId: 1 });
TransactionSchema.index({ transactionId: 1 });
TransactionSchema.index({ paidById: 1 });
