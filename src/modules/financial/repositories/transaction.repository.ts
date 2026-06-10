import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from 'src/common/repositories/base.repository';
import {
  Transaction,
  TransactionDocument,
} from '../schemas/transaction.schema';

@Injectable()
export class TransactionRepository extends BaseRepository<TransactionDocument> {
  constructor(
    @InjectModel(Transaction.name)
    private readonly txModel: Model<TransactionDocument>,
  ) {
    super(txModel);
  }

  async findByIdPopulated(id: string): Promise<TransactionDocument | null> {
    return this.findById(id, [
      { path: 'organizationId', select: 'name acronym' },
      { path: 'invoiceId', select: 'invoiceNumber saleNumber description' },
      { path: 'paidById', select: 'email username profile' },
      { path: 'createdBy', select: 'email username' },
    ]);
  }

  async findByInvoice(invoiceId: string): Promise<TransactionDocument[]> {
    return this.findAll({ invoiceId: new Types.ObjectId(invoiceId) }, [
      { path: 'paidById', select: 'email username profile' },
    ]);
  }

  async getTotalByOrg(organizationId: string): Promise<number> {
    const result = await this.aggregate([
      {
        $match: {
          organizationId: new Types.ObjectId(organizationId),
          status: 'completed',
          type: 'payment',
          isDeleted: false,
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total ?? 0;
  }
}
