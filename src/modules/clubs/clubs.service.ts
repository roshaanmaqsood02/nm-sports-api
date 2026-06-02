import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ClubsRepository } from './clubs.repository';
import { OrganizationsService } from '../organizations/organizations.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubDocument } from './schemas/club.schema';
import { ClubStatus } from './enums/club.enum';
import { RequestUser } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class ClubsService {
  private readonly logger = new Logger(ClubsService.name);

  constructor(
    private readonly clubsRepository: ClubsRepository,
    // ✅ Inject Service not Repository
    private readonly orgsService: OrganizationsService,
  ) {}

  // ─── Create ───────────────────────────────────────────────────
  async create(dto: CreateClubDto, user: RequestUser): Promise<ClubDocument> {
    // ✅ Validate org + sport in one call via service
    await this.orgsService.validateOrgAndSport(
      dto.organizationId,
      dto.sport,
      user,
    );

    const nameExists = await this.clubsRepository.exists({
      name: { $regex: `^${dto.name}$`, $options: 'i' },
      organizationId: new Types.ObjectId(dto.organizationId),
    });
    if (nameExists) {
      throw new ConflictException(
        `Club "${dto.name}" already exists in this organization`,
      );
    }

    const abbrevExists = await this.clubsRepository.exists({
      abbreviation: dto.abbreviation.toUpperCase(),
      organizationId: new Types.ObjectId(dto.organizationId),
    });
    if (abbrevExists) {
      throw new ConflictException(
        `Abbreviation "${dto.abbreviation}" already in use`,
      );
    }

    const club = await this.clubsRepository.create({
      name: dto.name,
      shortName: dto.shortName,
      abbreviation: dto.abbreviation.toUpperCase(),
      gender: dto.gender,
      sport: dto.sport,
      organizationId: new Types.ObjectId(dto.organizationId),
      divisionId: dto.divisionId
        ? new Types.ObjectId(dto.divisionId)
        : undefined,
      primaryColor: dto.primaryColor,
      secondaryColor: dto.secondaryColor,
      status: ClubStatus.ACTIVE,
      createdBy: user._id as any,
    });

    // ✅ Use service method to push ref
    await this.orgsService.addClubRef(
      dto.organizationId,
      (club._id as any).toString(),
    );

    this.logger.log(`✅ Club created: "${club.name}" by ${user.email}`);
    return club;
  }

  // ─── Find All ─────────────────────────────────────────────────
  async findAll(
    organizationId: string,
    page = 1,
    limit = 10,
    user: RequestUser,
    filters: {
      sport?: string;
      gender?: string;
      divisionId?: string;
      status?: string;
      search?: string;
    } = {},
  ) {
    const filter: Record<string, any> = {
      organizationId: new Types.ObjectId(organizationId),
    };

    if (filters.sport) filter['sport'] = filters.sport;
    if (filters.gender) filter['gender'] = filters.gender;
    if (filters.status) filter['status'] = filters.status;
    if (filters.divisionId) {
      filter['divisionId'] = new Types.ObjectId(filters.divisionId);
    }
    if (filters.search) {
      const regex = { $regex: filters.search, $options: 'i' };
      filter['$or'] = [
        { name: regex },
        { shortName: regex },
        { abbreviation: regex },
      ];
    }

    const { data, total } = await this.clubsRepository.findMany(
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
  async findOne(id: string, user: RequestUser): Promise<ClubDocument> {
    const club = await this.clubsRepository.findById(id);
    if (!club) throw new NotFoundException(`Club ${id} not found`);
    return club;
  }

  // ─── Update ───────────────────────────────────────────────────
  async update(
    id: string,
    dto: UpdateClubDto,
    user: RequestUser,
  ): Promise<ClubDocument> {
    const club = await this.clubsRepository.findById(id);
    if (!club) throw new NotFoundException(`Club ${id} not found`);

    if (
      dto.abbreviation &&
      dto.abbreviation.toUpperCase() !== club.abbreviation
    ) {
      const exists = await this.clubsRepository.exists({
        abbreviation: dto.abbreviation.toUpperCase(),
        organizationId: club.organizationId,
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
      'gender',
      'sport',
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
    if (dto.divisionId) {
      payload['divisionId'] = new Types.ObjectId(dto.divisionId);
    }

    const updated = await this.clubsRepository.update(id, { $set: payload });
    this.logger.log(`Club updated: ${id}`);
    return updated!;
  }

  // ─── Delete ───────────────────────────────────────────────────
  async remove(id: string, user: RequestUser): Promise<{ message: string }> {
    const club = await this.clubsRepository.findById(id);
    if (!club) throw new NotFoundException(`Club ${id} not found`);

    await this.clubsRepository.softDelete(id);

    // ✅ Use service method to pull ref
    await this.orgsService.removeClubRef(club.organizationId.toString(), id);

    this.logger.log(`Club deleted: ${id}`);
    return { message: 'Club deleted successfully' };
  }
}
