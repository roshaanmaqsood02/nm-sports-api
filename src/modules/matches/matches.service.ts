import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { MatchesRepository } from './matches.repository';
import { OrganizationsRepository } from '../organizations/organizations.repository';
import { TeamsRepository } from '../teams/teams.repository';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import {
  UpdateScoreDto,
  AddMatchEventDto,
  AddPlayerPerformanceDto,
  QueryMatchDto,
} from './dto/update-match.dto';
import { MatchDocument } from './schemas/match.schema';
import {
  MatchStatus,
  MatchResultType,
  MatchVenueType,
} from './enums/match.enum';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../users/enums/user.enum';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    private readonly matchesRepository: MatchesRepository,
    private readonly orgsRepository: OrganizationsRepository,
    private readonly teamsRepository: TeamsRepository,
  ) {}

  // ─── Create ───────────────────────────────────────────────────
  async create(
    dto: CreateMatchDto,
    currentUser: RequestUser,
  ): Promise<MatchDocument> {
    // Validate org
    const org = await this.orgsRepository.findById(dto.organizationId);
    if (!org) {
      throw new NotFoundException(
        `Organization ${dto.organizationId} not found`,
      );
    }
    this.checkOrgAccess(org, currentUser);

    // Validate teams
    const [homeTeam, awayTeam] = await Promise.all([
      this.teamsRepository.findById(dto.homeTeamId),
      this.teamsRepository.findById(dto.awayTeamId),
    ]);

    if (!homeTeam) {
      throw new NotFoundException(`Home team ${dto.homeTeamId} not found`);
    }
    if (!awayTeam) {
      throw new NotFoundException(`Away team ${dto.awayTeamId} not found`);
    }
    if (dto.homeTeamId === dto.awayTeamId) {
      throw new BadRequestException('Home and away teams must be different');
    }

    // Validate sport consistency
    if (homeTeam.sport !== dto.sport || awayTeam.sport !== dto.sport) {
      throw new BadRequestException(
        `Both teams must play ${dto.sport}. ` +
          `Home: ${homeTeam.sport}, Away: ${awayTeam.sport}`,
      );
    }

    const match = await this.matchesRepository.create({
      title: dto.title,
      matchNumber: dto.matchNumber,
      organizationId: new Types.ObjectId(dto.organizationId),
      tournamentId: dto.tournamentId
        ? new Types.ObjectId(dto.tournamentId)
        : undefined,
      sport: dto.sport,
      matchType: dto.matchType,
      scheduledAt: new Date(dto.scheduledAt),
      notes: dto.notes,

      homeTeam: {
        teamId: new Types.ObjectId(dto.homeTeamId),
        teamName: homeTeam.name,
        score: 0,
        penaltyScore: 0,
        halfTimeScore: 0,
        wickets: 0,
        overs: 0,
        extras: 0,
        q1Score: 0,
        q2Score: 0,
        q3Score: 0,
        q4Score: 0,
        overtimeScore: 0,
        fouls: 0,
        yellowCards: 0,
        redCards: 0,
      },

      awayTeam: {
        teamId: new Types.ObjectId(dto.awayTeamId),
        teamName: awayTeam.name,
        score: 0,
        penaltyScore: 0,
        halfTimeScore: 0,
        wickets: 0,
        overs: 0,
        extras: 0,
        q1Score: 0,
        q2Score: 0,
        q3Score: 0,
        q4Score: 0,
        overtimeScore: 0,
        fouls: 0,
        yellowCards: 0,
        redCards: 0,
      },

      venue: {
        name: dto.venueName,
        city: dto.venueCity,
        country: dto.venueCountry,
        type: dto.venueType ?? MatchVenueType.NEUTRAL, // Provide default value
        capacity: dto.venueCapacity,
      },

      officials: {
        referee: dto.referee,
        assistantReferee1: dto.assistantReferee1,
        assistantReferee2: dto.assistantReferee2,
        umpire1: dto.umpire1,
        umpire2: dto.umpire2,
      },

      weather: {
        condition: dto.weatherCondition,
        temperatureCelsius: dto.temperatureCelsius,
      },

      status: MatchStatus.SCHEDULED,
      createdBy: currentUser._id as any,
    });

    this.logger.log(
      `✅ Match created: ${homeTeam.name} vs ${awayTeam.name} ` +
        `on ${dto.scheduledAt} by ${currentUser.email}`,
    );
    return match;
  }

  // ─── Find All ─────────────────────────────────────────────────
  async findAll(query: QueryMatchDto, currentUser: RequestUser) {
    const {
      page = 1,
      limit = 10,
      organizationId,
      tournamentId,
      teamId,
      sport,
      status,
      matchType,
      from,
      to,
      search,
    } = query;

    const filter: any = {};

    if (!currentUser.isSuperAdmin) {
      const { data: userOrgs } = await this.orgsRepository.findMany(
        {
          $or: [{ createdBy: currentUser._id }, { members: currentUser._id }],
        },
        { limit: 1000 },
      );
      const orgIds = userOrgs.map((o) => (o._id as any).toString());
      filter['organizationId'] = { $in: orgIds };
    }

    if (organizationId)
      filter['organizationId'] = new Types.ObjectId(organizationId);
    if (tournamentId) filter['tournamentId'] = new Types.ObjectId(tournamentId);
    if (sport) filter['sport'] = sport;
    if (status) filter['status'] = status;
    if (matchType) filter['matchType'] = matchType;

    if (teamId) {
      filter['$or'] = [
        { 'homeTeam.teamId': new Types.ObjectId(teamId) },
        { 'awayTeam.teamId': new Types.ObjectId(teamId) },
      ];
    }

    if (from || to) {
      filter['scheduledAt'] = {};
      if (from) filter['scheduledAt']['$gte'] = new Date(from);
      if (to) filter['scheduledAt']['$lte'] = new Date(to);
    }

    if (search) {
      const regex = { $regex: search, $options: 'i' };
      filter['$or'] = [
        { title: regex },
        { matchNumber: regex },
        { 'homeTeam.teamName': regex },
        { 'awayTeam.teamName': regex },
        { 'venue.name': regex },
      ];
    }

    const { data, total } = await this.matchesRepository.findMany(filter, {
      page,
      limit,
      sort: { scheduledAt: -1 },
    });

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Find One ─────────────────────────────────────────────────
  async findOne(id: string, currentUser: RequestUser): Promise<MatchDocument> {
    const match = await this.matchesRepository.findById(id);
    if (!match) throw new NotFoundException(`Match ${id} not found`);
    this.checkAccess(match, currentUser);
    return match;
  }

  // ─── Update ───────────────────────────────────────────────────
  async update(
    id: string,
    dto: UpdateMatchDto,
    currentUser: RequestUser,
  ): Promise<MatchDocument> {
    const match = await this.matchesRepository.findById(id);
    if (!match) throw new NotFoundException(`Match ${id} not found`);
    this.checkAccess(match, currentUser);

    if (match.status === MatchStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot update a completed match. Use score/event endpoints instead.',
      );
    }

    const payload: any = {};
    const fields = [
      'title',
      'matchNumber',
      'matchType',
      'notes',
      'status',
      'result',
      'resultNotes',
      'attendance',
      'durationMinutes',
    ];

    fields.forEach((f) => {
      if ((dto as any)[f] !== undefined) payload[f] = (dto as any)[f];
    });

    if (dto.scheduledAt) payload['scheduledAt'] = new Date(dto.scheduledAt);
    if (dto.startedAt) payload['startedAt'] = new Date(dto.startedAt);
    if (dto.endedAt) payload['endedAt'] = new Date(dto.endedAt);

    // Venue
    if (dto.venueName) payload['venue.name'] = dto.venueName;
    if (dto.venueCity) payload['venue.city'] = dto.venueCity;
    if (dto.venueCountry) payload['venue.country'] = dto.venueCountry;
    if (dto.venueType) payload['venue.type'] = dto.venueType;
    if (dto.venueCapacity !== undefined) {
      payload['venue.capacity'] = dto.venueCapacity;
    }

    // Officials
    if (dto.referee) payload['officials.referee'] = dto.referee;
    if (dto.assistantReferee1)
      payload['officials.assistantReferee1'] = dto.assistantReferee1;
    if (dto.assistantReferee2)
      payload['officials.assistantReferee2'] = dto.assistantReferee2;
    if (dto.umpire1) payload['officials.umpire1'] = dto.umpire1;
    if (dto.umpire2) payload['officials.umpire2'] = dto.umpire2;

    // Weather
    if (dto.weatherCondition)
      payload['weather.condition'] = dto.weatherCondition;
    if (dto.temperatureCelsius !== undefined) {
      payload['weather.temperatureCelsius'] = dto.temperatureCelsius;
    }

    // Auto-set timestamps based on status change
    if (dto.status === MatchStatus.IN_PROGRESS && !match.startedAt) {
      payload['startedAt'] = new Date();
    }
    if (
      (dto.status === MatchStatus.COMPLETED ||
        dto.status === MatchStatus.ABANDONED) &&
      !match.endedAt
    ) {
      payload['endedAt'] = new Date();
    }

    const updated = await this.matchesRepository.update(id, {
      $set: payload,
    });

    this.logger.log(`Match updated: ${id} by ${currentUser.email}`);
    return updated!;
  }

  // ─── Update Score ─────────────────────────────────────────────
  async updateScore(
    id: string,
    dto: UpdateScoreDto,
    currentUser: RequestUser,
  ): Promise<MatchDocument> {
    const match = await this.matchesRepository.findById(id);
    if (!match) throw new NotFoundException(`Match ${id} not found`);
    this.checkAccess(match, currentUser);

    if (
      match.status === MatchStatus.SCHEDULED ||
      match.status === MatchStatus.POSTPONED
    ) {
      // Auto-start match when score is first updated
      await this.matchesRepository.update(id, {
        $set: {
          status: MatchStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
      });
    }

    const payload: any = {};

    if (dto.homeScore !== undefined) payload['homeTeam.score'] = dto.homeScore;
    if (dto.awayScore !== undefined) payload['awayTeam.score'] = dto.awayScore;
    if (dto.homeWickets !== undefined)
      payload['homeTeam.wickets'] = dto.homeWickets;
    if (dto.awayWickets !== undefined)
      payload['awayTeam.wickets'] = dto.awayWickets;
    if (dto.homeOvers !== undefined) payload['homeTeam.overs'] = dto.homeOvers;
    if (dto.awayOvers !== undefined) payload['awayTeam.overs'] = dto.awayOvers;
    if (dto.homeInningsSummary)
      payload['homeTeam.inningsSummary'] = dto.homeInningsSummary;
    if (dto.awayInningsSummary)
      payload['awayTeam.inningsSummary'] = dto.awayInningsSummary;
    if (dto.homePenaltyScore !== undefined)
      payload['homeTeam.penaltyScore'] = dto.homePenaltyScore;
    if (dto.awayPenaltyScore !== undefined)
      payload['awayTeam.penaltyScore'] = dto.awayPenaltyScore;
    if (dto.homeQ1 !== undefined) payload['homeTeam.q1Score'] = dto.homeQ1;
    if (dto.homeQ2 !== undefined) payload['homeTeam.q2Score'] = dto.homeQ2;
    if (dto.homeQ3 !== undefined) payload['homeTeam.q3Score'] = dto.homeQ3;
    if (dto.homeQ4 !== undefined) payload['homeTeam.q4Score'] = dto.homeQ4;
    if (dto.awayQ1 !== undefined) payload['awayTeam.q1Score'] = dto.awayQ1;
    if (dto.awayQ2 !== undefined) payload['awayTeam.q2Score'] = dto.awayQ2;
    if (dto.awayQ3 !== undefined) payload['awayTeam.q3Score'] = dto.awayQ3;
    if (dto.awayQ4 !== undefined) payload['awayTeam.q4Score'] = dto.awayQ4;

    const updated = await this.matchesRepository.update(id, {
      $set: payload,
    });

    this.logger.log(`Score updated for match ${id}`);
    return updated!;
  }

  // ─── Finalise Result ──────────────────────────────────────────
  async finalise(id: string, currentUser: RequestUser): Promise<MatchDocument> {
    const match = await this.matchesRepository.findById(id);
    if (!match) throw new NotFoundException(`Match ${id} not found`);
    this.checkAccess(match, currentUser);

    if (match.status === MatchStatus.COMPLETED) {
      throw new BadRequestException('Match is already completed');
    }

    // Auto-compute result from scores
    let result: MatchResultType;
    const h = match.homeTeam.score;
    const a = match.awayTeam.score;

    if (h > a) result = MatchResultType.HOME_WIN;
    else if (a > h) result = MatchResultType.AWAY_WIN;
    else result = MatchResultType.DRAW;

    const updated = await this.matchesRepository.update(id, {
      $set: {
        status: MatchStatus.COMPLETED,
        result,
        endedAt: new Date(),
      },
    });

    this.logger.log(
      `Match ${id} finalised: ${result} ` +
        `(${h} - ${a}) by ${currentUser.email}`,
    );
    return updated!;
  }

  // ─── Add Event ────────────────────────────────────────────────
  async addEvent(
    id: string,
    dto: AddMatchEventDto,
    currentUser: RequestUser,
  ): Promise<MatchDocument> {
    const match = await this.matchesRepository.findById(id);
    if (!match) throw new NotFoundException(`Match ${id} not found`);
    this.checkAccess(match, currentUser);

    const event: any = {
      eventType: dto.eventType,
      minute: dto.minute,
      playerName: dto.playerName,
      secondaryPlayerName: dto.secondaryPlayerName,
      teamName: dto.teamName,
      description: dto.description,
      scoreSnapshot: dto.scoreSnapshot,
    };

    if (dto.playerId) event.playerId = new Types.ObjectId(dto.playerId);
    if (dto.secondaryPlayerId)
      event.secondaryPlayerId = new Types.ObjectId(dto.secondaryPlayerId);
    if (dto.teamId) event.teamId = new Types.ObjectId(dto.teamId);

    const updated = await this.matchesRepository.addEvent(id, event);
    this.logger.log(
      `Event '${dto.eventType}' added to match ${id} ` +
        `at minute ${dto.minute ?? 'N/A'}`,
    );
    return updated!;
  }

  // ─── Remove Event ─────────────────────────────────────────────
  async removeEvent(
    matchId: string,
    eventId: string,
    currentUser: RequestUser,
  ): Promise<MatchDocument> {
    const match = await this.matchesRepository.findById(matchId);
    if (!match) throw new NotFoundException(`Match ${matchId} not found`);
    this.checkAccess(match, currentUser);

    const eventExists = match.events.some(
      (e) => (e as any)._id.toString() === eventId,
    );
    if (!eventExists) {
      throw new NotFoundException(`Event ${eventId} not found in this match`);
    }

    const updated = await this.matchesRepository.removeEvent(matchId, eventId);
    return updated!;
  }

  // ─── Upsert Player Performance ────────────────────────────────
  async upsertPerformance(
    matchId: string,
    dto: AddPlayerPerformanceDto,
    currentUser: RequestUser,
  ): Promise<MatchDocument> {
    const match = await this.matchesRepository.findById(matchId);
    if (!match) throw new NotFoundException(`Match ${matchId} not found`);
    this.checkAccess(match, currentUser);

    const performanceData = {
      playerName: dto.playerName,
      teamId: new Types.ObjectId(dto.teamId),
      started: dto.started ?? false,
      played: dto.played ?? true,
      minutesPlayed: dto.minutesPlayed ?? 0,
      goals: dto.goals ?? 0,
      assists: dto.assists ?? 0,
      yellowCards: dto.yellowCards ?? 0,
      redCards: dto.redCards ?? 0,
      rating: dto.rating,
      runsScored: dto.runsScored ?? 0,
      wicketsTaken: dto.wicketsTaken ?? 0,
      points: dto.points ?? 0,
      rebounds: dto.rebounds ?? 0,
      notes: dto.notes,
    };

    const updated = await this.matchesRepository.upsertPerformance(
      matchId,
      dto.playerId,
      performanceData,
    );

    this.logger.log(
      `Performance upserted for player ${dto.playerId} ` +
        `in match ${matchId}`,
    );
    return updated!;
  }

  // ─── Upcoming Matches ─────────────────────────────────────────
  async getUpcoming(limit = 5, currentUser: RequestUser) {
    const filter = this.buildOrgFilter(currentUser);
    return this.matchesRepository.findUpcoming(filter, limit);
  }

  // ─── Live Matches ─────────────────────────────────────────────
  async getLive(currentUser: RequestUser) {
    const filter = this.buildOrgFilter(currentUser);
    return this.matchesRepository.findLive(filter);
  }

  // ─── Head to Head ─────────────────────────────────────────────
  async getHeadToHead(
    teamAId: string,
    teamBId: string,
    limit = 10,
    currentUser: RequestUser,
  ) {
    const matches = await this.matchesRepository.findHeadToHead(
      teamAId,
      teamBId,
      limit,
    );

    let teamAWins = 0;
    let teamBWins = 0;
    let draws = 0;

    matches.forEach((m) => {
      if (m.result === MatchResultType.HOME_WIN) {
        if (m.homeTeam.teamId.toString() === teamAId) teamAWins++;
        else teamBWins++;
      } else if (m.result === MatchResultType.AWAY_WIN) {
        if (m.awayTeam.teamId.toString() === teamAId) teamAWins++;
        else teamBWins++;
      } else if (m.result === MatchResultType.DRAW) {
        draws++;
      }
    });

    return {
      teamAId,
      teamBId,
      totalMatches: matches.length,
      teamAWins,
      teamBWins,
      draws,
      matches,
    };
  }

  // ─── Stats ────────────────────────────────────────────────────
  async getStats(currentUser: RequestUser) {
    const filter = this.buildOrgFilter(currentUser);
    return this.matchesRepository.getStatsSummary(filter);
  }

  // ─── Delete ───────────────────────────────────────────────────
  async remove(
    id: string,
    currentUser: RequestUser,
  ): Promise<{ message: string }> {
    const match = await this.matchesRepository.findById(id);
    if (!match) throw new NotFoundException(`Match ${id} not found`);
    this.checkAccess(match, currentUser);

    if (match.status === MatchStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot delete a match in progress');
    }

    await this.matchesRepository.softDelete(id);
    this.logger.log(`Match deleted: ${id} by ${currentUser.email}`);
    return { message: 'Match deleted successfully' };
  }

  // ─── Access helpers ───────────────────────────────────────────
  private checkAccess(match: MatchDocument, user: RequestUser): void {
    if (user.isSuperAdmin) return;
    if (user.role === UserRole.ADMIN) return;

    const isCreator = match.createdBy.toString() === user._id;
    if (!isCreator) {
      throw new ForbiddenException('You do not have access to this match');
    }
  }

  private checkOrgAccess(org: any, user: RequestUser): void {
    if (user.isSuperAdmin) return;
    if (user.role === UserRole.ADMIN) return;

    const isOwner = org.createdBy.toString() === user._id;
    const isMember = org.members?.some((m: any) => m.toString() === user._id);
    if (!isOwner && !isMember) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }
  }

  private buildOrgFilter(user: RequestUser): Record<string, any> {
    if (user.isSuperAdmin) return {};
    return { createdBy: user._id };
  }
}
