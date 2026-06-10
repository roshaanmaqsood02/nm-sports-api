import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from 'src/common/repositories/base.repository';
import {
  PaymentTerm,
  PaymentTermDocument,
} from '../schemas/payment-term.schema';

@Injectable()
export class PaymentTermRepository extends BaseRepository<PaymentTermDocument> {
  constructor(
    @InjectModel(PaymentTerm.name)
    private readonly paymentTermModel: Model<PaymentTermDocument>,
  ) {
    super(paymentTermModel);
  }

  async findByIdPopulated(id: string): Promise<PaymentTermDocument | null> {
    return this.findById(id, [
      { path: 'organizationId', select: 'name acronym' },
      { path: 'appliedToSaleItems', select: 'name price' },
      { path: 'createdBy', select: 'email username' },
    ]);
  }

  async findActiveForOrg(
    organizationId: string,
  ): Promise<PaymentTermDocument[]> {
    const now = new Date();
    return this.findAll({
      organizationId: new Types.ObjectId(organizationId),
      status: 'active',
      activeFrom: { $lte: now },
      $or: [{ activeTo: { $gte: now } }, { activeTo: null }],
    });
  }
}
