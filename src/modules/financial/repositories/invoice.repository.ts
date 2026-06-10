import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice, InvoiceDocument } from '../schemas/invoice.schema';
import { InvoiceStatus } from '../enums/financial.enum';
import { randomUUID } from 'crypto';
import { BaseRepository } from 'src/common/repositories/base.repository';

@Injectable()
export class InvoiceRepository extends BaseRepository<InvoiceDocument> {
  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,
  ) {
    super(invoiceModel);
  }

  async findByIdPopulated(id: string): Promise<InvoiceDocument | null> {
    return this.findById(id, [
      { path: 'organizationId', select: 'name acronym' },
      { path: 'memberId', select: 'email username profile' },
      {
        path: 'paymentTermId',
        select: 'name installmentCount installmentWindow',
      },
      { path: 'createdBy', select: 'email username' },
    ]);
  }

  async getNextSaleNumber(): Promise<string> {
    const count = await this.invoiceModel.countDocuments();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    const suffix = Array.from(
      { length: 5 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join('');
    return `WO${suffix}${String(count + 1).padStart(2, '0')}`;
  }

  async getNextInvoiceNumber(): Promise<string> {
    const count = await this.invoiceModel.countDocuments();
    const year = new Date().getFullYear();
    return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  async findPastDue(): Promise<InvoiceDocument[]> {
    return this.findAll({
      status: InvoiceStatus.OPEN,
      nextPaymentDate: { $lt: new Date() },
    });
  }

  async markPastDue(): Promise<number> {
    const result = await this.invoiceModel.updateMany(
      {
        status: InvoiceStatus.OPEN,
        nextPaymentDate: { $lt: new Date() },
        isDeleted: false,
      },
      { $set: { status: InvoiceStatus.PAST_DUE } },
    );
    return result.modifiedCount;
  }

  async applyPayment(
    id: string,
    amount: number,
    nextPaymentDate?: Date,
  ): Promise<InvoiceDocument | null> {
    const invoice = await this.findById(id);
    if (!invoice) return null;

    const newAmountPaid = invoice.amountPaid + amount;
    const newAmountDue = Math.max(0, invoice.total - newAmountPaid);
    const newStatus =
      newAmountDue === 0 ? InvoiceStatus.PAID_IN_FULL : invoice.status;

    return this.updateById(id, {
      $set: {
        amountPaid: newAmountPaid,
        amountDue: newAmountDue,
        status: newStatus,
        paidAt: newAmountDue === 0 ? new Date() : undefined,
        ...(nextPaymentDate && { nextPaymentDate }),
      },
    });
  }

  async getFinancialSummary(organizationId: string): Promise<{
    totalRevenue: number;
    totalOutstanding: number;
    totalOverdue: number;
  }> {
    const result = await this.aggregate([
      {
        $match: {
          organizationId: new Types.ObjectId(organizationId),
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amountPaid' },
          totalOutstanding: { $sum: '$amountDue' },
          totalOverdue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'past_due'] }, '$amountDue', 0],
            },
          },
        },
      },
    ]);

    return (
      result[0] ?? { totalRevenue: 0, totalOutstanding: 0, totalOverdue: 0 }
    );
  }
}
