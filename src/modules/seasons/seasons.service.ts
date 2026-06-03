import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { SeasonsRepository } from './seasons.repository';
import { OrganizationsService } from '../organizations/organizations.service';
import { CreateSeasonDto, CreateSubseasonDto } from './dto/create-season.dto';
import {
  UpdateSeasonDto,
  UpdateSubseasonDto,
  GenerateSeedsDto,
  GenerateGameIdsDto,
} from './dto/update-season.dto';
import { SeasonDocument } from './schemas/season.schema';
import {
  SeasonStatus,
  SubseasonStatus,
  DataSourceType,
  GameIdGeneration,
} from './enums/season.enum';
import { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../users/enums/user.enum';

@Injectable()
export class SeasonsService {
  private readonly logger = new Logger(SeasonsService.name);

  constructor(
    private readonly repo: SeasonsRepository,
    private readonly orgsService: OrganizationsService,
  ) {}

  async create(
    dto: CreateSeasonDto,
    user: RequestUser,
  ): Promise<SeasonDocument> {
    // Validate org access
    await this.orgsService.validateOrg(dto.organizationId, user);

    // Duplicate check
    const exists = await this.repo.exists({
      name: { $regex: `^${dto.name}$`, $options: 'i' },
      organizationId: new Types.ObjectId(dto.organizationId),
    });

    if (exists) {
      throw new ConflictException(
        `Season "${dto.name}" already exists in this organization`,
      );
    }

    // Build season document
    const seasonData: any = {
      name: dto.name,
      organizationId: new Types.ObjectId(dto.organizationId),
      type: dto.type,
      clubOrLeagueId: dto.clubOrLeagueId
        ? new Types.ObjectId(dto.clubOrLeagueId)
        : undefined,
      clubOrLeagueName: dto.clubOrLeagueName,
      staticGrouping: dto.staticGrouping,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      status: dto.status ?? SeasonStatus.DRAFT,
      description: dto.description,
      createdBy: user._id as any,
      subseasons: [],
    };

    // Inline subseason creation
    if (dto.subseason) {
      seasonData.subseasons = [this.buildSubseasonData(dto.subseason)];
    }

    const season = await this.repo.create(seasonData);

    this.logger.log(`Season created: "${season.name}" by ${user.email}`);
    return season;
  }

  async findAll(
    organizationId: string,
    page = 1,
    limit = 10,
    user: RequestUser,
    filters: {
      type?: string;
      status?: string;
      clubOrLeagueId?: string;
      search?: string;
    } = {},
  ) {
    const filter: Record<string, any> = {
      organizationId: new Types.ObjectId(organizationId),
    };

    if (filters.type) filter['type'] = filters.type;
    if (filters.status) filter['status'] = filters.status;
    if (filters.clubOrLeagueId) {
      filter['clubOrLeagueId'] = new Types.ObjectId(filters.clubOrLeagueId);
    }
    if (filters.search) {
      filter['$or'] = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { clubOrLeagueName: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const { data, total } = await this.repo.findMany(filter, page, limit);

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: RequestUser): Promise<SeasonDocument> {
    const season = await this.repo.findById(id);
    if (!season) throw new NotFoundException(`Season ${id} not found`);
    return season;
  }

  async update(
    id: string,
    dto: UpdateSeasonDto,
    user: RequestUser,
  ): Promise<SeasonDocument> {
    const season = await this.repo.findById(id);
    if (!season) throw new NotFoundException(`Season ${id} not found`);
    this.checkAccess(season, user);

    const payload: Record<string, any> = {};
    const fields = [
      'name',
      'type',
      'clubOrLeagueName',
      'staticGrouping',
      'status',
      'description',
    ];
    fields.forEach((f) => {
      if ((dto as any)[f] !== undefined) payload[f] = (dto as any)[f];
    });

    if (dto.clubOrLeagueId) {
      payload['clubOrLeagueId'] = new Types.ObjectId(dto.clubOrLeagueId);
    }
    if (dto.startDate) payload['startDate'] = new Date(dto.startDate);
    if (dto.endDate) payload['endDate'] = new Date(dto.endDate);

    const updated = await this.repo.update(id, { $set: payload });
    this.logger.log(`Season updated: ${id}`);
    return updated!;
  }

  async activate(id: string, user: RequestUser): Promise<SeasonDocument> {
    const season = await this.repo.findById(id);
    if (!season) throw new NotFoundException(`Season ${id} not found`);
    this.checkAccess(season, user);

    if (season.status !== SeasonStatus.DRAFT) {
      throw new BadRequestException('Only draft seasons can be activated');
    }

    return (await this.repo.update(id, {
      $set: { status: SeasonStatus.ACTIVE },
    }))!;
  }

  async complete(id: string, user: RequestUser): Promise<SeasonDocument> {
    const season = await this.repo.findById(id);
    if (!season) throw new NotFoundException(`Season ${id} not found`);
    this.checkAccess(season, user);

    if (season.status !== SeasonStatus.ACTIVE) {
      throw new BadRequestException('Only active seasons can be completed');
    }

    return (await this.repo.update(id, {
      $set: { status: SeasonStatus.COMPLETED, endDate: new Date() },
    }))!;
  }

  async remove(id: string, user: RequestUser): Promise<{ message: string }> {
    const season = await this.repo.findById(id);
    if (!season) throw new NotFoundException(`Season ${id} not found`);
    this.checkAccess(season, user);

    if (season.status === SeasonStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete an active season');
    }

    await this.repo.softDelete(id);
    this.logger.log(`Season deleted: ${id}`);
    return { message: 'Season deleted successfully' };
  }

  async addSubseason(
    seasonId: string,
    dto: CreateSubseasonDto,
    user: RequestUser,
  ): Promise<SeasonDocument> {
    const season = await this.repo.findById(seasonId);
    if (!season) throw new NotFoundException(`Season ${seasonId} not found`);
    this.checkAccess(season, user);

    // Validate copy_subseason source
    if (dto.dataSource === DataSourceType.COPY_SUBSEASON) {
      if (!dto.sourceSubseasonId) {
        throw new BadRequestException(
          'sourceSubseasonId is required when dataSource is copy_subseason',
        );
      }

      // Optionally copy config from source subseason
      const source = season.subseasons.find(
        (s) => (s as any)._id.toString() === dto.sourceSubseasonId,
      );

      if (!source) {
        throw new NotFoundException(
          `Source subseason ${dto.sourceSubseasonId} not found`,
        );
      }

      // Inherit settings from source if not overridden
      if (!dto.gameTypeTitle) dto.gameTypeTitle = source.gameTypeTitle;
      if (!dto.groupNameTitle) dto.groupNameTitle = source.groupNameTitle;
      if (!dto.staticGrouping) dto.staticGrouping = source.staticGrouping;
    }

    // Check duplicate subseason name within season
    const nameExists = season.subseasons.some(
      (s) => s.name.toLowerCase() === dto.name.toLowerCase(),
    );
    if (nameExists) {
      throw new ConflictException(
        `Subseason "${dto.name}" already exists in this season`,
      );
    }

    const subseasonData = this.buildSubseasonData(dto);
    const updated = await this.repo.addSubseason(seasonId, subseasonData);

    this.logger.log(`Subseason "${dto.name}" added to season ${seasonId}`);
    return updated!;
  }

  async updateSubseason(
    seasonId: string,
    subseasonId: string,
    dto: UpdateSubseasonDto,
    user: RequestUser,
  ): Promise<SeasonDocument> {
    const season = await this.repo.findById(seasonId);
    if (!season) throw new NotFoundException(`Season ${seasonId} not found`);
    this.checkAccess(season, user);

    const subseason = season.subseasons.find(
      (s) => (s as any)._id.toString() === subseasonId,
    );
    if (!subseason) {
      throw new NotFoundException(
        `Subseason ${subseasonId} not found in season`,
      );
    }

    const payload: Record<string, any> = {};
    const scalarFields = [
      'name',
      'shortName',
      'order',
      'dataSource',
      'gameIdGeneration',
      'gameIdPrefix',
      'gameTypeTitle',
      'groupNameTitle',
      'staticGrouping',
      'customGroups',
      'status',
      'notes',
    ];

    scalarFields.forEach((f) => {
      if ((dto as any)[f] !== undefined) payload[f] = (dto as any)[f];
    });

    if (dto.startDate) payload['startDate'] = new Date(dto.startDate);
    if (dto.endDate) payload['endDate'] = new Date(dto.endDate);

    // Copy subseason config
    if (dto.sourceSubseasonId && dto.sourceSubseasonId.trim()) {
      payload['copyConfig.sourceSubseasonId'] = new Types.ObjectId(
        dto.sourceSubseasonId,
      );
      payload['copyConfig.sourceSubseasonName'] = dto.sourceSubseasonName;
    }
    if (dto.topDivisionPageSource !== undefined)
      payload['copyConfig.topDivisionPageSource'] = dto.topDivisionPageSource;
    if (dto.bottomDivisionPageSource !== undefined)
      payload['copyConfig.bottomDivisionPageSource'] =
        dto.bottomDivisionPageSource;
    if (dto.topTeamPageSource !== undefined)
      payload['copyConfig.topTeamPageSource'] = dto.topTeamPageSource;
    if (dto.bottomTeamPageSource !== undefined)
      payload['copyConfig.bottomTeamPageSource'] = dto.bottomTeamPageSource;

    // Seed config
    if (dto.seedEnabled !== undefined)
      payload['seedConfig.enabled'] = dto.seedEnabled;
    if (dto.seedAutoGenerate !== undefined)
      payload['seedConfig.autoGenerate'] = dto.seedAutoGenerate;
    if (dto.seedCount !== undefined)
      payload['seedConfig.seedCount'] = dto.seedCount;
    if (dto.seedRules !== undefined)
      payload['seedConfig.seedRules'] = dto.seedRules;

    const updated = await this.repo.updateSubseason(
      seasonId,
      subseasonId,
      payload,
    );

    this.logger.log(`Subseason ${subseasonId} updated in season ${seasonId}`);
    return updated!;
  }

  async removeSubseason(
    seasonId: string,
    subseasonId: string,
    user: RequestUser,
  ): Promise<{ message: string }> {
    const season = await this.repo.findById(seasonId);
    if (!season) throw new NotFoundException(`Season ${seasonId} not found`);
    this.checkAccess(season, user);

    const subseason = season.subseasons.find(
      (s) => (s as any)._id.toString() === subseasonId,
    );
    if (!subseason) {
      throw new NotFoundException(`Subseason ${subseasonId} not found`);
    }

    if (subseason.status === SubseasonStatus.ACTIVE) {
      throw new BadRequestException('Cannot remove an active subseason');
    }

    await this.repo.removeSubseason(seasonId, subseasonId);
    this.logger.log(`Subseason ${subseasonId} removed from season ${seasonId}`);
    return { message: 'Subseason removed successfully' };
  }

  async reorderSubseasons(
    seasonId: string,
    orderedIds: string[],
    user: RequestUser,
  ): Promise<SeasonDocument> {
    const season = await this.repo.findById(seasonId);
    if (!season) throw new NotFoundException(`Season ${seasonId} not found`);
    this.checkAccess(season, user);

    // Update order of each subseason
    await Promise.all(
      orderedIds.map((subId, index) =>
        this.repo.updateSubseason(seasonId, subId, { order: index + 1 }),
      ),
    );

    return (await this.repo.findById(seasonId))!;
  }

  async generateGameIds(
    seasonId: string,
    subseasonId: string,
    dto: GenerateGameIdsDto,
    user: RequestUser,
  ) {
    const season = await this.repo.findById(seasonId);
    if (!season) throw new NotFoundException(`Season ${seasonId} not found`);
    this.checkAccess(season, user);

    const subseason = season.subseasons.find(
      (s) => (s as any)._id.toString() === subseasonId,
    );
    if (!subseason) {
      throw new NotFoundException(`Subseason ${subseasonId} not found`);
    }

    if (subseason.gameIdGeneration !== GameIdGeneration.AUTO_GENERATE) {
      throw new BadRequestException(
        'Game ID generation is not enabled for this subseason. ' +
          'Set gameIdGeneration to auto_generate first.',
      );
    }

    const prefix = dto.prefix ?? subseason.gameIdPrefix ?? '';
    const count = dto.count ?? 10;
    const startFrom = subseason.gameIdCounter;

    // Generate IDs
    const gameIds = Array.from({ length: count }, (_, i) => {
      const num = String(startFrom + i).padStart(4, '0');
      return `${prefix}${num}`;
    });

    // Increment counter
    await this.repo.incrementGameIdCounter(seasonId, subseasonId, count);

    this.logger.log(`Generated ${count} game IDs for subseason ${subseasonId}`);

    return {
      subseasonId,
      prefix,
      generated: count,
      startFrom,
      gameIds,
    };
  }

  async generateSeeds(
    seasonId: string,
    subseasonId: string,
    dto: GenerateSeedsDto,
    user: RequestUser,
  ) {
    const season = await this.repo.findById(seasonId);
    if (!season) throw new NotFoundException(`Season ${seasonId} not found`);
    this.checkAccess(season, user);

    const subseason = season.subseasons.find(
      (s) => (s as any)._id.toString() === subseasonId,
    );
    if (!subseason) {
      throw new NotFoundException(`Subseason ${subseasonId} not found`);
    }

    if (!subseason.seedConfig?.enabled) {
      throw new BadRequestException(
        'Seeding is not enabled for this subseason. ' +
          'Set seedConfig.enabled to true first.',
      );
    }

    const seedCount = dto.seedCount ?? subseason.seedConfig.seedCount ?? 8;

    const seeds = Array.from({ length: seedCount }, (_, i) => {
      const seed = i + 1;
      const teamId = dto.teamIds?.[i] ?? undefined;

      return {
        seed,
        teamId,
        teamName: teamId ? `Team ${seed}` : undefined,
      };
    });

    this.logger.log(
      `Generated ${seedCount} seeds for subseason ${subseasonId}`,
    );

    return {
      subseasonId,
      seedCount,
      seeds,
    };
  }

  async getStats(organizationId: string, user: RequestUser) {
    const base = {
      organizationId: new Types.ObjectId(organizationId),
    };

    const [total, active, completed, draft] = await Promise.all([
      this.repo.count(base),
      this.repo.count({ ...base, status: SeasonStatus.ACTIVE }),
      this.repo.count({ ...base, status: SeasonStatus.COMPLETED }),
      this.repo.count({ ...base, status: SeasonStatus.DRAFT }),
    ]);

    return { total, active, completed, draft };
  }

  private buildSubseasonData(dto: CreateSubseasonDto): Record<string, any> {
    return {
      name: dto.name,
      shortName: dto.shortName,
      order: dto.order ?? 0,
      dataSource: dto.dataSource,

      copyConfig: {
        // FIX: guard against empty string AND undefined/null
        sourceSubseasonId:
          dto.sourceSubseasonId && dto.sourceSubseasonId.trim()
            ? new Types.ObjectId(dto.sourceSubseasonId)
            : undefined,
        sourceSubseasonName: dto.sourceSubseasonName,
        topDivisionPageSource: dto.topDivisionPageSource,
        bottomDivisionPageSource: dto.bottomDivisionPageSource,
        topTeamPageSource: dto.topTeamPageSource,
        bottomTeamPageSource: dto.bottomTeamPageSource,
      },

      gameIdGeneration: dto.gameIdGeneration,
      gameIdPrefix: dto.gameIdPrefix,
      gameIdCounter: 1,

      seedConfig: {
        enabled: dto.seedEnabled ?? false,
        autoGenerate: dto.seedAutoGenerate ?? false,
        seedCount: dto.seedCount ?? 0,
        seedRules: dto.seedRules,
      },

      gameTypeTitle: dto.gameTypeTitle ?? 'Game Type',
      groupNameTitle: dto.groupNameTitle ?? 'Group',
      staticGrouping: dto.staticGrouping,
      customGroups: dto.customGroups ?? [],
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      status: dto.status ?? SubseasonStatus.DRAFT,
      notes: dto.notes,
    };
  }
  private checkAccess(season: SeasonDocument, user: RequestUser): void {
    if (user.isSuperAdmin) return;
    if (user.role === UserRole.ADMIN) return;
    if (season.createdBy.toString() === user._id) return;
    throw new ForbiddenException('You do not have access to this season');
  }
}
