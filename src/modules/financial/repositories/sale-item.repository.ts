import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { SaleItem, SaleItemDocument } from '../schemas/sale-item.schema';

@Injectable()
export class SaleItemRepository extends BaseRepository<SaleItemDocument> {
  constructor(
    @InjectModel(SaleItem.name)
    private readonly saleItemModel: Model<SaleItemDocument>,
  ) {
    super(saleItemModel);
  }

  async findByIdPopulated(id: string): Promise<SaleItemDocument | null> {
    return this.findById(id, [
      { path: 'organizationId', select: 'name acronym' },
      { path: 'createdBy', select: 'email username' },
    ]);
  }

  async incrementSold(id: string, quantity = 1, revenue = 0): Promise<void> {
    await this.updateById(id, {
      $inc: { totalSold: quantity, totalRevenue: revenue },
    });
  }

  async addVariation(
    itemId: string,
    variation: Record<string, any>,
  ): Promise<SaleItemDocument | null> {
    return this.updateById(itemId, {
      $push: { variations: variation },
    });
  }

  async removeVariation(
    itemId: string,
    variationId: string,
  ): Promise<SaleItemDocument | null> {
    return this.updateById(itemId, {
      $pull: { variations: { _id: new Types.ObjectId(variationId) } },
    });
  }

  async updateVariation(
    itemId: string,
    variationId: string,
    update: Record<string, any>,
  ): Promise<SaleItemDocument | null> {
    const setPayload: Record<string, any> = {};
    Object.entries(update).forEach(([key, value]) => {
      setPayload[`variations.$.${key}`] = value;
    });

    return this.saleItemModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(itemId),
          isDeleted: false,
          'variations._id': new Types.ObjectId(variationId),
        },
        { $set: setPayload },
        { new: true },
      )
      .exec();
  }
}
