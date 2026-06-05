import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Website, WebsiteDocument } from './schemas/website.schema';
import {
  CustomWebsiteRequest,
  CustomWebsiteRequestDocument,
} from './schemas/custom-website-request.schema';
import { WebsiteStatus } from './enums/website.enum';

@Injectable()
export class WebsitesRepository {
  constructor(
    @InjectModel(Website.name)
    private readonly websiteModel: Model<WebsiteDocument>,

    @InjectModel(CustomWebsiteRequest.name)
    private readonly customRequestModel: Model<CustomWebsiteRequestDocument>,
  ) {}

  async createWebsite(data: Partial<Website>): Promise<WebsiteDocument> {
    return new this.websiteModel(data).save();
  }

  async findWebsiteById(id: string): Promise<WebsiteDocument | null> {
    return this.websiteModel
      .findOne({ _id: id, isDeleted: false })
      .populate('organizationId', 'name acronym logo')
      .populate('createdBy', 'email username')
      .exec();
  }

  async findWebsiteByOrg(
    organizationId: string,
  ): Promise<WebsiteDocument | null> {
    return this.websiteModel
      .findOne({
        organizationId: new Types.ObjectId(organizationId),
        isDeleted: false,
        status: { $ne: WebsiteStatus.CANCELLED },
      })
      .populate('organizationId', 'name acronym')
      .exec();
  }

  async findWebsites(
    filter: Record<string, any> = {},
    page = 1,
    limit = 10,
  ): Promise<{ data: WebsiteDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const base = { ...filter, isDeleted: false };

    const [data, total] = await Promise.all([
      this.websiteModel
        .find(base)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('organizationId', 'name acronym')
        .populate('createdBy', 'email username')
        .exec(),
      this.websiteModel.countDocuments(base).exec(),
    ]);

    return { data, total };
  }

  async updateWebsite(
    id: string,
    update: Record<string, any>,
  ): Promise<WebsiteDocument | null> {
    return this.websiteModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true })
      .populate('organizationId', 'name acronym')
      .exec();
  }

  async softDeleteWebsite(id: string): Promise<void> {
    await this.websiteModel.updateOne(
      { _id: id },
      { isDeleted: true, deletedAt: new Date() },
    );
  }

  async websiteExists(filter: Record<string, any>): Promise<boolean> {
    return !!(await this.websiteModel.exists({ ...filter, isDeleted: false }));
  }

  async countWebsites(filter: Record<string, any> = {}): Promise<number> {
    return this.websiteModel
      .countDocuments({ ...filter, isDeleted: false })
      .exec();
  }

  async createCustomRequest(
    data: Partial<CustomWebsiteRequest>,
  ): Promise<CustomWebsiteRequestDocument> {
    return new this.customRequestModel(data).save();
  }

  async findCustomRequestById(
    id: string,
  ): Promise<CustomWebsiteRequestDocument | null> {
    return this.customRequestModel
      .findOne({ _id: id, isDeleted: false })
      .populate('organizationId', 'name acronym')
      .populate('submittedBy', 'email username profile')
      .exec();
  }

  async findCustomRequests(
    filter: Record<string, any> = {},
    page = 1,
    limit = 10,
  ): Promise<{ data: CustomWebsiteRequestDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const base = { ...filter, isDeleted: false };

    const [data, total] = await Promise.all([
      this.customRequestModel
        .find(base)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('organizationId', 'name acronym')
        .populate('submittedBy', 'email username profile')
        .exec(),
      this.customRequestModel.countDocuments(base).exec(),
    ]);

    return { data, total };
  }

  async updateCustomRequest(
    id: string,
    update: Record<string, any>,
  ): Promise<CustomWebsiteRequestDocument | null> {
    return this.customRequestModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true })
      .exec();
  }

  async softDeleteCustomRequest(id: string): Promise<void> {
    await this.customRequestModel.updateOne(
      { _id: id },
      { isDeleted: true, deletedAt: new Date() },
    );
  }

  async countCustomRequests(filter: Record<string, any> = {}): Promise<number> {
    return this.customRequestModel
      .countDocuments({ ...filter, isDeleted: false })
      .exec();
  }

  async getNextCustomRequestReference(): Promise<string> {
    const count = await this.customRequestModel.countDocuments();
    const year = new Date().getFullYear();
    const seq = String(count + 1).padStart(5, '0');
    return `CWR-${year}-${seq}`;
  }
}
