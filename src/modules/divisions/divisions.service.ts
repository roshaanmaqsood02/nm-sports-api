import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { DivisionsRepository } from './divisions.repository';
import { OrganizationsService } from '../organizations/organizations.service';
import { CreateDivisionDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';
import { DivisionDocument } from './schemas/division.schema';
import { DivisionStatus } from './enums/division.enum';
import { RequestUser } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class DivisionsService {
  private readonly logger = new Logger(DivisionsService.name);

  constructor(
    private readonly divisionsRepository: DivisionsRepository,
    // ✅ Inject Service not Repository
    private readonly orgsService: OrganizationsService,
  ) {}

  // ─── Create ───────────────────────────────────────────────────
  async create(
    dto: CreateDivisionDto,
    user: RequestUser,
  ): Promise<DivisionDocument> {
    // ✅ Use service method — no direct repo access
    await this.orgsService.validateOrg(dto.organizationId, user);

    // Duplicate name in same org
    const nameExists = await this.divisionsRepository.exists({
      name: { $regex: `^${dto.name}$`, $options: 'i' },
      organizationId: new Types.ObjectId(dto.organizationId),
    });
    if (nameExists) {
      throw new ConflictException(
        `Division "${dto.name}" already exists in this organization`,
      );
    }

    // Duplicate abbreviation in same org
    const abbrevExists = await this.divisionsRepository.exists({
      abbreviation: dto.abbreviation.toUpperCase(),
      organizationId: new Types.ObjectId(dto.organizationId),
    });
    if (abbrevExists) {
      throw new ConflictException(
        `Abbreviation "${dto.abbreviation}" already in use`,
      );
    }

    const division = await this.divisionsRepository.create({
      name: dto.name,
      shortName: dto.shortName,
      abbreviation: dto.abbreviation.toUpperCase(),
      type: dto.type,
      organizationId: new Types.ObjectId(dto.organizationId),
      primaryColor: dto.primaryColor,
      secondaryColor: dto.secondaryColor,
      status: DivisionStatus.ACTIVE,
      createdBy: user._id as any,
    });

    // ✅ Use service method to push ref
    await this.orgsService.addDivisionRef(
      dto.organizationId,
      (division._id as any).toString(),
    );

    this.logger.log(`✅ Division created: "${division.name}" by ${user.email}`);
    return division;
  }

  // ─── Find All ─────────────────────────────────────────────────
  async findAll(
    organizationId: string,
    page = 1,
    limit = 10,
    user: RequestUser,
    filters: {
      type?: string;
      status?: string;
      search?: string;
    } = {},
  ) {
    const filter: Record<string, any> = {
      organizationId: new Types.ObjectId(organizationId),
    };

    if (filters.type) filter['type'] = filters.type;
    if (filters.status) filter['status'] = filters.status;
    if (filters.search) {
      const regex = { $regex: filters.search, $options: 'i' };
      filter['$or'] = [
        { name: regex },
        { shortName: regex },
        { abbreviation: regex },
      ];
    }

    const { data, total } = await this.divisionsRepository.findMany(
      filter,
      page,
      limit,
    );

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Find One ─────────────────────────────────────────────────
  async findOne(id: string, user: RequestUser): Promise<DivisionDocument> {
    const division = await this.divisionsRepository.findById(id);
    if (!division) {
      throw new NotFoundException(`Division ${id} not found`);
    }
    return division;
  }

  // ─── Update ───────────────────────────────────────────────────
  async update(
    id: string,
    dto: UpdateDivisionDto,
    user: RequestUser,
  ): Promise<DivisionDocument> {
    const division = await this.divisionsRepository.findById(id);
    if (!division) {
      throw new NotFoundException(`Division ${id} not found`);
    }

    // Check abbreviation uniqueness if changing
    if (
      dto.abbreviation &&
      dto.abbreviation.toUpperCase() !== division.abbreviation
    ) {
      const exists = await this.divisionsRepository.exists({
        abbreviation: dto.abbreviation.toUpperCase(),
        organizationId: division.organizationId,
        _id: { $ne: id },
      });
      if (exists) {
        throw new ConflictException(`Abbreviation already in use`);
      }
    }

    const payload: Record<string, any> = {};
    const fields = [
      'name',
      'shortName',
      'type',
      'primaryColor',
      'secondaryColor',
      'status',
    ];
    fields.forEach((f) => {
      if ((dto as any)[f] !== undefined) payload[f] = (dto as any)[f];
    });
    if (dto.abbreviation) {
      payload['abbreviation'] = dto.abbreviation.toUpperCase();
    }

    const updated = await this.divisionsRepository.update(id, {
      $set: payload,
    });

    this.logger.log(`Division updated: ${id}`);
    return updated!;
  }

  // ─── Delete ───────────────────────────────────────────────────
  async remove(id: string, user: RequestUser): Promise<{ message: string }> {
    const division = await this.divisionsRepository.findById(id);
    if (!division) {
      throw new NotFoundException(`Division ${id} not found`);
    }

    await this.divisionsRepository.softDelete(id);

    // ✅ Use service method to pull ref
    await this.orgsService.removeDivisionRef(
      division.organizationId.toString(),
      id,
    );

    this.logger.log(`Division deleted: ${id}`);
    return { message: 'Division deleted successfully' };
  }
}
