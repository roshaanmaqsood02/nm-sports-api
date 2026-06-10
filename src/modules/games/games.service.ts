import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { GamesRepository } from './games.repository';
import { CreateGameDto } from './dto/create-game.dto';
import {
  UpdateGameDto,
  AddOpponentDto,
  UpdateGameScoreDto,
} from './dto/update-game.dto';
import { GameDocument } from './schemas/game.schema';
import { GameStatus } from './enums/game.enum';
import { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../users/enums/user.enum';

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);

  constructor(private readonly repo: GamesRepository) {}

  // ── Create ────────────────────────────────────────────────────
  async create(dto: CreateGameDto, user: RequestUser): Promise<GameDocument> {
    const game = await this.repo.create({
      name: dto.name,
      organizationId: this.repo.toObjectId(dto.organizationId),
      teamId: dto.teamId ? this.repo.toObjectId(dto.teamId) : undefined,
      teamName: dto.teamName,
      date: new Date(dto.date),
      time: {
        startTime: dto.time.startTime,
        endTime: dto.time.endTime,
        timezone: dto.time.timezone,
        displayTime: dto.time.displayTime ?? this.buildDisplayTime(dto.time),
        durationMinutes: dto.time.durationMinutes,
        durationDisplay: dto.time.durationDisplay,
      },
      venue: {
        name: dto.venue.name,
        street: dto.venue.street,
        city: dto.venue.city,
        state: dto.venue.state,
        country: dto.venue.country,
        zip: dto.venue.zip,
        fullAddress: dto.venue.fullAddress ?? this.buildFullAddress(dto.venue),
      },
      gameType: dto.gameType,
      opponents: dto.opponents ?? [],
      status: dto.status ?? GameStatus.SCHEDULED,
      homeScore: dto.homeScore ?? 0,
      awayScore: dto.awayScore ?? 0,
      arrivalTime: dto.arrivalTime,
      uniformDetail: dto.uniformDetail,
      notes: dto.notes,
      visibility: dto.visibility,
      season: dto.season,
      leagueId: dto.leagueId ? this.repo.toObjectId(dto.leagueId) : undefined,
      leagueName: dto.leagueName,
      createdBy: user._id as any,
    });

    this.logger.log(`✅ Game created: "${game.name}" by ${user.email}`);
    return game;
  }

  // ── Find All ──────────────────────────────────────────────────
  async findAll(
    page = 1,
    limit = 10,
    user: RequestUser,
    filters: {
      organizationId?: string;
      teamId?: string;
      status?: string;
      gameType?: string;
      season?: string;
      leagueId?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    } = {},
  ) {
    const filter: Record<string, any> = {};

    if (!user.isSuperAdmin && user.role !== UserRole.ADMIN) {
      filter['createdBy'] = this.repo.toObjectId(user._id);
    }
    if (filters.organizationId)
      filter['organizationId'] = this.repo.toObjectId(filters.organizationId);
    if (filters.teamId) filter['teamId'] = this.repo.toObjectId(filters.teamId);
    if (filters.status) filter['status'] = filters.status;
    if (filters.gameType) filter['gameType'] = filters.gameType;
    if (filters.season) filter['season'] = filters.season;
    if (filters.leagueId)
      filter['leagueId'] = this.repo.toObjectId(filters.leagueId);

    if (filters.startDate || filters.endDate) {
      filter['date'] = {};
      if (filters.startDate)
        filter['date']['$gte'] = new Date(filters.startDate);
      if (filters.endDate) filter['date']['$lte'] = new Date(filters.endDate);
    }

    if (filters.search) {
      Object.assign(
        filter,
        this.repo.buildSearchFilter(
          ['name', 'teamName', 'leagueName', 'venue.name', 'venue.city'],
          filters.search,
        ),
      );
    }

    return this.repo.findMany({
      filter,
      page,
      limit,
      sort: { date: -1 },
      populate: [
        { path: 'organizationId', select: 'name acronym' },
        { path: 'teamId', select: 'name abbreviation' },
      ],
    });
  }

  // ── Find One ──────────────────────────────────────────────────
  async findOne(id: string, user: RequestUser): Promise<GameDocument> {
    const game = await this.repo.findByIdPopulated(id);
    if (!game) throw new NotFoundException(`Game ${id} not found`);
    return game;
  }

  // ── Update ────────────────────────────────────────────────────
  async update(
    id: string,
    dto: UpdateGameDto,
    user: RequestUser,
  ): Promise<GameDocument> {
    const game = await this.repo.findByIdPopulated(id);
    if (!game) throw new NotFoundException(`Game ${id} not found`);

    this.checkAccess(game, user);

    const payload: Record<string, any> = {};
    const scalar = [
      'name',
      'teamName',
      'gameType',
      'status',
      'arrivalTime',
      'uniformDetail',
      'notes',
      'season',
      'leagueName',
      'visibility',
      'homeScore',
      'awayScore',
    ];
    scalar.forEach((f) => {
      if ((dto as any)[f] !== undefined) payload[f] = (dto as any)[f];
    });

    if (dto.date) payload['date'] = new Date(dto.date);
    if (dto.teamId) payload['teamId'] = this.repo.toObjectId(dto.teamId);
    if (dto.leagueId) payload['leagueId'] = this.repo.toObjectId(dto.leagueId);

    if (dto.time) {
      const t = dto.time;
      if (t.startTime) payload['time.startTime'] = t.startTime;
      if (t.endTime) payload['time.endTime'] = t.endTime;
      if (t.timezone) payload['time.timezone'] = t.timezone;
      if (t.durationMinutes)
        payload['time.durationMinutes'] = t.durationMinutes;
      if (t.durationDisplay)
        payload['time.durationDisplay'] = t.durationDisplay;
      payload['time.displayTime'] = t.displayTime ?? this.buildDisplayTime(t);
    }

    if (dto.venue) {
      const v = dto.venue;
      if (v.name) payload['venue.name'] = v.name;
      if (v.street) payload['venue.street'] = v.street;
      if (v.city) payload['venue.city'] = v.city;
      if (v.state) payload['venue.state'] = v.state;
      if (v.country) payload['venue.country'] = v.country;
      if (v.zip) payload['venue.zip'] = v.zip;
      payload['venue.fullAddress'] = v.fullAddress ?? this.buildFullAddress(v);
    }

    if (dto.opponents !== undefined) payload['opponents'] = dto.opponents;

    const updated = await this.repo.updateById(id, { $set: payload });
    this.logger.log(`Game updated: ${id}`);
    return updated!;
  }

  // ── Status transitions ────────────────────────────────────────
  async updateStatus(
    id: string,
    status: GameStatus,
    user: RequestUser,
  ): Promise<GameDocument> {
    const game = await this.repo.findByIdPopulated(id);
    if (!game) throw new NotFoundException(`Game ${id} not found`);
    this.checkAccess(game, user);

    const updated = await this.repo.updateById(id, { $set: { status } });
    return updated!;
  }

  // ── Score update ──────────────────────────────────────────────
  async updateScore(
    id: string,
    dto: UpdateGameScoreDto,
    user: RequestUser,
  ): Promise<GameDocument> {
    const game = await this.repo.findByIdPopulated(id);
    if (!game) throw new NotFoundException(`Game ${id} not found`);
    this.checkAccess(game, user);

    const updated = await this.repo.updateScore(
      id,
      dto.homeScore ?? game.homeScore,
      dto.awayScore ?? game.awayScore,
    );
    return updated!;
  }

  // ── Opponent management ───────────────────────────────────────
  async addOpponent(
    id: string,
    dto: AddOpponentDto,
    user: RequestUser,
  ): Promise<GameDocument> {
    const game = await this.repo.findByIdPopulated(id);
    if (!game) throw new NotFoundException(`Game ${id} not found`);
    this.checkAccess(game, user);

    const updated = await this.repo.addOpponent(id, dto.opponent);
    return updated!;
  }

  async removeOpponent(
    id: string,
    opponentId: string,
    user: RequestUser,
  ): Promise<GameDocument> {
    const game = await this.repo.findByIdPopulated(id);
    if (!game) throw new NotFoundException(`Game ${id} not found`);
    this.checkAccess(game, user);

    const updated = await this.repo.removeOpponent(id, opponentId);
    return updated!;
  }

  // ── Delete ────────────────────────────────────────────────────
  async remove(id: string, user: RequestUser): Promise<{ message: string }> {
    const game = await this.repo.findByIdPopulated(id);
    if (!game) throw new NotFoundException(`Game ${id} not found`);
    this.checkAccess(game, user);

    await this.repo.softDelete(id);
    this.logger.log(`Game deleted: ${id}`);
    return { message: 'Game deleted successfully' };
  }

  // ── Stats ─────────────────────────────────────────────────────
  async getStats(organizationId: string, user: RequestUser) {
    const base = { organizationId: this.repo.toObjectId(organizationId) };

    const [total, scheduled, completed, cancelled, upcoming] =
      await Promise.all([
        this.repo.count(base),
        this.repo.count({ ...base, status: GameStatus.SCHEDULED }),
        this.repo.count({ ...base, status: GameStatus.COMPLETED }),
        this.repo.count({ ...base, status: GameStatus.CANCELLED }),
        this.repo.count({
          ...base,
          date: { $gte: new Date() },
          status: GameStatus.SCHEDULED,
        }),
      ]);

    return { total, scheduled, completed, cancelled, upcoming };
  }

  // ── Helpers ───────────────────────────────────────────────────
  private buildDisplayTime(time: any): string {
    if (!time?.startTime) return '';
    const parts = [time.startTime];
    if (time.endTime) parts.push(time.endTime);
    const display = parts.join(' - ');
    return time.timezone ? `${display} ${time.timezone}` : display;
  }

  private buildFullAddress(venue: any): string {
    return [venue.name, venue.street, venue.city, venue.state, venue.country]
      .filter(Boolean)
      .join(', ');
  }

  private checkAccess(game: GameDocument, user: RequestUser): void {
    if (user.isSuperAdmin || user.role === UserRole.ADMIN) return;
    if (game.createdBy.toString() === user._id) return;
    throw new ForbiddenException('You do not have access to this game');
  }
}
