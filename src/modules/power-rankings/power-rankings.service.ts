import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { PowerRankingsRepository } from './power-rankings.repository';
import { CreatePowerRankingDto } from './dto/create-power-ranking.dto';
import {
  UpdatePowerRankingDto,
  RankedTeamDto,
  ReorderRankingsDto,
} from './dto/update-power-ranking.dto';
import { PowerRankingDocument } from './schemas/power-ranking.schema';
import {
  PowerRankingStatus,
  RankChangeDirection,
} from './enums/power-ranking.enum';
import { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../users/enums/user.enum';

@Injectable()
export class PowerRankingsService {
  private readonly logger = new Logger(PowerRankingsService.name);

  constructor(private readonly repo: PowerRankingsRepository) {}

  async create(
    dto: CreatePowerRankingDto,
    user: RequestUser,
  ): Promise<PowerRankingDocument> {
    const ranking = await this.repo.create({
      title: dto.title,
      label: dto.label,
      organizationId: new Types.ObjectId(dto.organizationId),
      leagueId: dto.leagueId ? new Types.ObjectId(dto.leagueId) : undefined,
      leagueName: dto.leagueName,
      subseasonId: dto.subseasonId
        ? new Types.ObjectId(dto.subseasonId)
        : undefined,
      subseasonName: dto.subseasonName,
      status: dto.status ?? PowerRankingStatus.DRAFT,
      rankings: [],
      createdBy: user._id as any,
    });

    this.logger.log(
      `Power Ranking created: "${ranking.title}" [${ranking.label}] ` +
        `by ${user.email}`,
    );
    return ranking;
  }

  async findAll(
    page = 1,
    limit = 10,
    user: RequestUser,
    filters: {
      organizationId?: string;
      leagueId?: string;
      subseasonId?: string;
      status?: string;
      search?: string;
    } = {},
  ) {
    const filter: Record<string, any> = {};

    if (!user.isSuperAdmin && user.role !== UserRole.ADMIN) {
      filter['createdBy'] = new Types.ObjectId(user._id);
    }

    if (filters.organizationId) {
      filter['organizationId'] = new Types.ObjectId(filters.organizationId);
    }
    if (filters.leagueId) {
      filter['leagueId'] = new Types.ObjectId(filters.leagueId);
    }
    if (filters.subseasonId) {
      filter['subseasonId'] = new Types.ObjectId(filters.subseasonId);
    }
    if (filters.status) filter['status'] = filters.status;
    if (filters.search) {
      const regex = { $regex: filters.search, $options: 'i' };
      filter['$or'] = [
        { title: regex },
        { label: regex },
        { leagueName: regex },
        { subseasonName: regex },
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

  async findOne(id: string, user: RequestUser): Promise<PowerRankingDocument> {
    const ranking = await this.repo.findById(id);
    if (!ranking) {
      throw new NotFoundException(`Power Ranking ${id} not found`);
    }
    return ranking;
  }

  async update(
    id: string,
    dto: UpdatePowerRankingDto,
    user: RequestUser,
  ): Promise<PowerRankingDocument> {
    const ranking = await this.repo.findById(id);
    if (!ranking) throw new NotFoundException(`Power Ranking ${id} not found`);

    this.checkAccess(ranking, user);

    const payload: Record<string, any> = {};

    // Scalar fields
    const fields = ['title', 'label', 'leagueName', 'subseasonName', 'status'];
    fields.forEach((f) => {
      if ((dto as any)[f] !== undefined) payload[f] = (dto as any)[f];
    });

    if (dto.leagueId) {
      payload['leagueId'] = new Types.ObjectId(dto.leagueId);
    }
    if (dto.subseasonId) {
      payload['subseasonId'] = new Types.ObjectId(dto.subseasonId);
    }

    // If status set to published — stamp publishedAt
    if (dto.status === PowerRankingStatus.PUBLISHED && !ranking.publishedAt) {
      payload['publishedAt'] = new Date();
    }

    // Replace full rankings array if provided
    if (dto.rankings !== undefined) {
      this.validateRankings(dto.rankings);

      payload['rankings'] = dto.rankings.map((row) => this.buildRowData(row));
    }

    const updated = await this.repo.update(id, { $set: payload });
    this.logger.log(`Power Ranking updated: ${id}`);
    return updated!;
  }

  async publish(id: string, user: RequestUser): Promise<PowerRankingDocument> {
    const ranking = await this.repo.findById(id);
    if (!ranking) throw new NotFoundException(`Power Ranking ${id} not found`);

    this.checkAccess(ranking, user);

    if (ranking.rankings.filter((r) => r.isActive).length === 0) {
      throw new BadRequestException(
        'Cannot publish a power ranking with no teams. Add at least one team row first.',
      );
    }

    const updated = await this.repo.update(id, {
      $set: {
        status: PowerRankingStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    this.logger.log(`Power Ranking published: ${id}`);
    return updated!;
  }

  async archive(id: string, user: RequestUser): Promise<PowerRankingDocument> {
    const ranking = await this.repo.findById(id);
    if (!ranking) throw new NotFoundException(`Power Ranking ${id} not found`);

    this.checkAccess(ranking, user);

    const updated = await this.repo.update(id, {
      $set: { status: PowerRankingStatus.ARCHIVED },
    });
    return updated!;
  }

  async addRow(
    id: string,
    dto: RankedTeamDto,
    user: RequestUser,
  ): Promise<PowerRankingDocument> {
    const ranking = await this.repo.findById(id);
    if (!ranking) throw new NotFoundException(`Power Ranking ${id} not found`);

    this.checkAccess(ranking, user);

    // Check duplicate rank
    const rankTaken = ranking.rankings.some(
      (r) => r.rank === dto.rank && r.isActive,
    );

    if (rankTaken) {
      // Auto-shift ranks down to make room
      await this.shiftRanksDown(id, dto.rank, ranking);
    }

    const rowData = this.buildRowData(dto);
    const updated = await this.repo.addRow(id, rowData);

    this.logger.log(
      `Row added to Power Ranking ${id}: Rank #${dto.rank} "${dto.teamName}"`,
    );
    return updated!;
  }

  async updateRow(
    id: string,
    rowId: string,
    dto: RankedTeamDto,
    user: RequestUser,
  ): Promise<PowerRankingDocument> {
    const ranking = await this.repo.findById(id);
    if (!ranking) throw new NotFoundException(`Power Ranking ${id} not found`);

    this.checkAccess(ranking, user);

    const row = ranking.rankings.find(
      (r) => (r as any)._id.toString() === rowId,
    );

    if (!row) {
      throw new NotFoundException(`Row ${rowId} not found in this ranking`);
    }

    // Determine change direction automatically if previousRank set
    let changeDirection = dto.changeDirection ?? RankChangeDirection.SAME;
    let changeAmount = dto.changeAmount ?? 0;

    if (dto.previousRank && dto.rank !== dto.previousRank) {
      changeAmount = dto.previousRank - dto.rank;
      changeDirection =
        dto.rank < dto.previousRank
          ? RankChangeDirection.UP
          : RankChangeDirection.DOWN;
    }

    const updateData = {
      rank: dto.rank,
      teamName: dto.teamName,
      teamAbbreviation: dto.teamAbbreviation,
      teamLogo: dto.teamLogo,
      previousRank: dto.previousRank ?? row.rank,
      changeDirection,
      changeAmount: Math.abs(changeAmount),
      record: dto.record,
      points: dto.points ?? row.points,
      notes: dto.notes,
      isActive: dto.isActive ?? row.isActive,
    };

    if (dto.teamId) {
      (updateData as any)['teamId'] = new Types.ObjectId(dto.teamId);
    }

    const updated = await this.repo.updateRow(id, rowId, updateData);
    this.logger.log(`Row ${rowId} updated in Power Ranking ${id}`);
    return updated!;
  }

  async removeRow(
    id: string,
    rowId: string,
    user: RequestUser,
  ): Promise<PowerRankingDocument> {
    const ranking = await this.repo.findById(id);
    if (!ranking) throw new NotFoundException(`Power Ranking ${id} not found`);

    this.checkAccess(ranking, user);

    const row = ranking.rankings.find(
      (r) => (r as any)._id.toString() === rowId,
    );
    if (!row) {
      throw new NotFoundException(`Row ${rowId} not found`);
    }

    const updated = await this.repo.removeRow(id, rowId);
    this.logger.log(`Row ${rowId} removed from Power Ranking ${id}`);
    return updated!;
  }

  async deleteRow(
    id: string,
    rowId: string,
    user: RequestUser,
  ): Promise<PowerRankingDocument> {
    const ranking = await this.repo.findById(id);
    if (!ranking) throw new NotFoundException(`Power Ranking ${id} not found`);

    this.checkAccess(ranking, user);

    const updated = await this.repo.deleteRow(id, rowId);
    this.logger.log(`Row ${rowId} deleted from Power Ranking ${id}`);
    return updated!;
  }

  // Add this helper method to your class
  private isMongooseDocument(obj: any): obj is { toObject(): any } {
    return obj && typeof obj.toObject === 'function';
  }

  // Then in reorderRows:
  async reorderRows(
    id: string,
    dto: ReorderRankingsDto,
    user: RequestUser,
  ): Promise<PowerRankingDocument> {
    const ranking = await this.repo.findById(id);
    if (!ranking) throw new NotFoundException(`Power Ranking ${id} not found`);

    this.checkAccess(ranking, user);

    // Rebuild rankings with new rank numbers based on ordered IDs
    const reorderedRows = dto.orderedIds.map((rowId, index) => {
      const existing = ranking.rankings.find(
        (r) => (r as any)._id.toString() === rowId,
      );

      if (!existing) {
        throw new NotFoundException(`Row ${rowId} not found in ranking`);
      }

      // Convert to plain object safely
      const existingObj = this.isMongooseDocument(existing)
        ? existing.toObject()
        : existing;

      return {
        ...existingObj,
        previousRank: existing.rank,
        rank: index + 1,
        changeDirection: this.computeDirection(existing.rank, index + 1),
        changeAmount: Math.abs(existing.rank - (index + 1)),
      };
    });

    const updated = await this.repo.update(id, {
      $set: { rankings: reorderedRows },
    });

    this.logger.log(`Rows reordered in Power Ranking ${id}`);
    return updated!;
  }

  async remove(id: string, user: RequestUser): Promise<{ message: string }> {
    const ranking = await this.repo.findById(id);
    if (!ranking) throw new NotFoundException(`Power Ranking ${id} not found`);

    this.checkAccess(ranking, user);

    await this.repo.softDelete(id);
    this.logger.log(`Power Ranking deleted: ${id}`);
    return { message: 'Power ranking deleted successfully' };
  }

  async getStats(user: RequestUser) {
    const base =
      user.isSuperAdmin || user.role === UserRole.ADMIN
        ? {}
        : { createdBy: new Types.ObjectId(user._id) };

    const [total, published, draft, archived] = await Promise.all([
      this.repo.count(base),
      this.repo.count({ ...base, status: PowerRankingStatus.PUBLISHED }),
      this.repo.count({ ...base, status: PowerRankingStatus.DRAFT }),
      this.repo.count({ ...base, status: PowerRankingStatus.ARCHIVED }),
    ]);

    return { total, published, draft, archived };
  }

  private buildRowData(dto: RankedTeamDto): Record<string, any> {
    return {
      rank: dto.rank,
      ...(dto.teamId && { teamId: new Types.ObjectId(dto.teamId) }),
      teamName: dto.teamName,
      teamAbbreviation: dto.teamAbbreviation,
      teamLogo: dto.teamLogo,
      previousRank: dto.previousRank,
      changeDirection: dto.changeDirection ?? RankChangeDirection.NEW,
      changeAmount: dto.changeAmount ?? 0,
      record: dto.record,
      points: dto.points ?? 0,
      notes: dto.notes,
      isActive: dto.isActive ?? true,
    };
  }

  private validateRankings(rows: RankedTeamDto[]): void {
    const activeRows = rows.filter((r) => r.isActive !== false);
    const ranks = activeRows.map((r) => r.rank);
    const uniqueRanks = new Set(ranks);

    if (uniqueRanks.size !== ranks.length) {
      throw new BadRequestException(
        'Duplicate rank positions found. Each active row must have a unique rank.',
      );
    }
  }

  private async shiftRanksDown(
    rankingId: string,
    fromRank: number,
    ranking: PowerRankingDocument,
  ): Promise<void> {
    // Shift all active rows at fromRank and below down by 1
    const rowsToShift = ranking.rankings.filter(
      (r) => r.rank >= fromRank && r.isActive,
    );

    await Promise.all(
      rowsToShift.map((row) =>
        this.repo.updateRow(rankingId, (row as any)._id.toString(), {
          rank: row.rank + 1,
        }),
      ),
    );
  }

  private computeDirection(
    oldRank: number,
    newRank: number,
  ): RankChangeDirection {
    if (newRank < oldRank) return RankChangeDirection.UP;
    if (newRank > oldRank) return RankChangeDirection.DOWN;
    return RankChangeDirection.SAME;
  }

  private checkAccess(ranking: PowerRankingDocument, user: RequestUser): void {
    if (user.isSuperAdmin) return;
    if (user.role === UserRole.ADMIN) return;
    if (ranking.createdBy.toString() === user._id) return;
    throw new ForbiddenException(
      'You do not have access to this power ranking',
    );
  }
}
