import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Registration,
  RegistrationDocument,
} from './schemas/registration.schema';

@Injectable()
export class RegistrationsRepository {
  constructor(
    @InjectModel(Registration.name)
    private readonly registrationModel: Model<RegistrationDocument>,
  ) {}

  async create(data: Partial<Registration>): Promise<RegistrationDocument> {
    return new this.registrationModel(data).save();
  }

  async findById(id: string): Promise<RegistrationDocument | null> {
    return this.registrationModel
      .findOne({ _id: id, isDeleted: false })
      .populate('submittedBy', 'email username profile')
      .populate('organizationId', 'name acronym')
      .exec();
  }

  async findByReference(
    referenceNumber: string,
  ): Promise<RegistrationDocument | null> {
    return this.registrationModel
      .findOne({ referenceNumber, isDeleted: false })
      .exec();
  }

  async findMany(
    filter: Record<string, any> = {},
    page = 1,
    limit = 10,
  ): Promise<{ data: RegistrationDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const base = { ...filter, isDeleted: false };

    const [data, total] = await Promise.all([
      this.registrationModel
        .find(base)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('submittedBy', 'email username profile')
        .populate('organizationId', 'name acronym')
        .exec(),
      this.registrationModel.countDocuments(base).exec(),
    ]);

    return { data, total };
  }

  async update(
    id: string,
    update: Record<string, any>,
  ): Promise<RegistrationDocument | null> {
    return this.registrationModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true })
      .exec();
  }

  async softDelete(id: string): Promise<void> {
    await this.registrationModel.updateOne(
      { _id: id },
      { isDeleted: true, deletedAt: new Date() },
    );
  }

  async count(filter: Record<string, any> = {}): Promise<number> {
    return this.registrationModel
      .countDocuments({ ...filter, isDeleted: false })
      .exec();
  }

  // Get next reference number
  async getNextReferenceNumber(): Promise<string> {
    const count = await this.registrationModel.countDocuments();
    const year = new Date().getFullYear();
    const seq = String(count + 1).padStart(5, '0');
    return `KS-${year}-${seq}`;
  }
}
