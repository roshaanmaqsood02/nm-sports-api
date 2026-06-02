import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { TournamentsRepository } from './tournaments.repository';
import { OrganizationsService } from '../organizations/organizations.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import {
  RegisterTeamDto,
  UpdateTeamRegistrationDto,
  AssignGroupsDto,
} from './dto/tournament-team.dto';
import {
  CreateBracketMatchDto,
  UpdateBracketMatchDto,
  UpdateStandingDto,
} from './dto/bracket.dto';
import { TournamentDocument } from './schemas/tournament.schema';
import {
  TournamentStatus,
  TournamentFormat,
  BracketMatchStatus,
  BracketRound,
  TournamentTeamStatus,
} from './enums/tournament.enum';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../users/enums/user.enum';

@Injectable()
export class TournamentsService {
  private readonly logger = new Logger(TournamentsService.name);

  constructor(
    private readonly repo: TournamentsRepository,
    private readonly orgsService: OrganizationsService,
  ) {}

  // ══════════════════════════════════════════════════════════════
  // TOURNAMENT CRUD
  // ══════════════════════════════════════════════════════════════

  async create(
    dto: CreateTournamentDto,
    user: RequestUser,
  ): Promise<TournamentDocument> {
    await this.orgsService.validateOrg(dto.organizationId, user);

    const exists = await this.repo.exists({
      name: { $regex: `^${dto.name}$`, $options: 'i' },
      organizationId: new Types.ObjectId(dto.organizationId),
    });

    if (exists) {
      throw new ConflictException(
        `Tournament "${dto.name}" already exists in this organization`,
      );
    }

    const tournament = await this.repo.create({
      name: dto.name,
      description: dto.description,
      edition: dto.edition,
      organizationId: new Types.ObjectId(dto.organizationId),
      sport: dto.sport,
      format: dto.format,
      visibility: dto.visibility,
      maxTeams: dto.maxTeams,
      registeredTeams: 0,
      registrationStartDate: dto.registrationStartDate
        ? new Date(dto.registrationStartDate)
        : undefined,
      registrationEndDate: dto.registrationEndDate
        ? new Date(dto.registrationEndDate)
        : undefined,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      venue: {
        name: dto.venueName,
        address: dto.venueAddress,
        city: dto.venueCity,
        country: dto.venueCountry,
      },
      prize: {
        first: dto.prizeFirst,
        second: dto.prizeSecond,
        third: dto.prizeThird,
        description: dto.prizeDescription,
      },
      contact: {
        name: dto.contactName,
        email: dto.contactEmail,
        phone: dto.contactPhone,
      },
      rules: dto.rules,
      numberOfGroups: dto.numberOfGroups ?? 0,
      teamsAdvancingPerGroup: dto.teamsAdvancingPerGroup ?? 2,
      status: TournamentStatus.DRAFT,
      createdBy: user._id as any,
    });

    this.logger.log(
      `✅ Tournament created: "${tournament.name}" by ${user.email}`,
    );
    return tournament;
  }

  async findAll(
    page = 1,
    limit = 10,
    user: RequestUser,
    filters: {
      organizationId?: string;
      sport?: string;
      format?: string;
      status?: string;
      search?: string;
    } = {},
  ) {
    const filter: Record<string, any> = {};

    if (!user.isSuperAdmin) {
      // Use service-level access — only show orgs user belongs to
      // For public tournaments, show all published ones
      filter['$or'] = [
        {
          visibility: 'public',
          status: { $in: ['published', 'upcoming', 'active', 'completed'] },
        },
        { createdBy: new Types.ObjectId(user._id) },
      ];
    }

    if (filters.organizationId) {
      filter['organizationId'] = new Types.ObjectId(filters.organizationId);
    }
    if (filters.sport) filter['sport'] = filters.sport;
    if (filters.format) filter['format'] = filters.format;
    if (filters.status) filter['status'] = filters.status;

    if (filters.search) {
      const regex = { $regex: filters.search, $options: 'i' };
      filter['$or'] = [
        { name: regex },
        { description: regex },
        { edition: regex },
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

  async findOne(id: string, user: RequestUser): Promise<TournamentDocument> {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundException(`Tournament ${id} not found`);
    return t;
  }

  async update(
    id: string,
    dto: UpdateTournamentDto,
    user: RequestUser,
  ): Promise<TournamentDocument> {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundException(`Tournament ${id} not found`);

    this.checkAccess(t, user);

    if (
      t.status === TournamentStatus.COMPLETED ||
      t.status === TournamentStatus.CANCELLED
    ) {
      throw new BadRequestException(`Cannot update a ${t.status} tournament`);
    }

    const payload: Record<string, any> = {};
    const fields = [
      'name',
      'description',
      'edition',
      'sport',
      'format',
      'visibility',
      'maxTeams',
      'rules',
      'status',
      'numberOfGroups',
      'teamsAdvancingPerGroup',
      'winnerId',
      'winnerName',
      'runnerUpId',
      'runnerUpName',
    ];

    fields.forEach((f) => {
      if ((dto as any)[f] !== undefined) payload[f] = (dto as any)[f];
    });

    const dateFields = [
      'registrationStartDate',
      'registrationEndDate',
      'startDate',
      'endDate',
    ];
    dateFields.forEach((f) => {
      if ((dto as any)[f]) payload[f] = new Date((dto as any)[f]);
    });

    if (dto.venueName) payload['venue.name'] = dto.venueName;
    if (dto.venueAddress) payload['venue.address'] = dto.venueAddress;
    if (dto.venueCity) payload['venue.city'] = dto.venueCity;
    if (dto.venueCountry) payload['venue.country'] = dto.venueCountry;

    if (dto.prizeFirst) payload['prize.first'] = dto.prizeFirst;
    if (dto.prizeSecond) payload['prize.second'] = dto.prizeSecond;
    if (dto.prizeThird) payload['prize.third'] = dto.prizeThird;
    if (dto.prizeDescription)
      payload['prize.description'] = dto.prizeDescription;

    if (dto.contactName) payload['contact.name'] = dto.contactName;
    if (dto.contactEmail) payload['contact.email'] = dto.contactEmail;
    if (dto.contactPhone) payload['contact.phone'] = dto.contactPhone;

    const updated = await this.repo.update(id, { $set: payload });
    this.logger.log(`Tournament updated: ${id}`);
    return updated!;
  }

  async publish(id: string, user: RequestUser): Promise<TournamentDocument> {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundException(`Tournament ${id} not found`);
    this.checkAccess(t, user);

    if (t.status !== TournamentStatus.DRAFT) {
      throw new BadRequestException('Only draft tournaments can be published');
    }

    const updated = await this.repo.update(id, {
      $set: { status: TournamentStatus.PUBLISHED },
    });
    this.logger.log(`Tournament published: ${id}`);
    return updated!;
  }

  async start(id: string, user: RequestUser): Promise<TournamentDocument> {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundException(`Tournament ${id} not found`);
    this.checkAccess(t, user);

    if (
      t.status !== TournamentStatus.PUBLISHED &&
      t.status !== TournamentStatus.UPCOMING
    ) {
      throw new BadRequestException(
        'Tournament must be published or upcoming to start',
      );
    }

    if (t.registeredTeams < 2) {
      throw new BadRequestException(
        'At least 2 teams must be registered to start the tournament',
      );
    }

    const updated = await this.repo.update(id, {
      $set: { status: TournamentStatus.ACTIVE },
    });
    this.logger.log(`Tournament started: ${id}`);
    return updated!;
  }

  async complete(id: string, user: RequestUser): Promise<TournamentDocument> {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundException(`Tournament ${id} not found`);
    this.checkAccess(t, user);

    if (t.status !== TournamentStatus.ACTIVE) {
      throw new BadRequestException('Only active tournaments can be completed');
    }

    const updated = await this.repo.update(id, {
      $set: {
        status: TournamentStatus.COMPLETED,
        endDate: new Date(),
      },
    });
    this.logger.log(`Tournament completed: ${id}`);
    return updated!;
  }

  async remove(id: string, user: RequestUser): Promise<{ message: string }> {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundException(`Tournament ${id} not found`);
    this.checkAccess(t, user);

    if (t.status === TournamentStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete an active tournament');
    }

    await this.repo.softDelete(id);
    await this.repo.deleteBracket(id);
    await this.repo.deleteStandings(id);

    this.logger.log(`Tournament deleted: ${id}`);
    return { message: 'Tournament deleted successfully' };
  }

  // ══════════════════════════════════════════════════════════════
  // TEAM REGISTRATION
  // ══════════════════════════════════════════════════════════════

  async registerTeam(
    id: string,
    dto: RegisterTeamDto,
    user: RequestUser,
  ): Promise<TournamentDocument> {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundException(`Tournament ${id} not found`);

    if (
      t.status !== TournamentStatus.PUBLISHED &&
      t.status !== TournamentStatus.UPCOMING
    ) {
      throw new BadRequestException(
        'Team registration is not open for this tournament',
      );
    }

    if (t.registeredTeams >= t.maxTeams) {
      throw new BadRequestException('Tournament is full');
    }

    const alreadyRegistered = t.teams.some(
      (team) => team.teamId.toString() === dto.teamId,
    );
    if (alreadyRegistered) {
      throw new ConflictException('Team is already registered');
    }

    const updated = await this.repo.addTeam(id, {
      teamId: new Types.ObjectId(dto.teamId),
      teamName: dto.teamName,
      teamAbbreviation: dto.teamAbbreviation,
      seed: dto.seed,
      group: dto.group?.toUpperCase(),
      status: TournamentTeamStatus.REGISTERED,
      notes: dto.notes,
    });

    // Auto-initialize standings entry
    await this.repo.upsertStanding(id, dto.teamId, {
      tournamentId: new Types.ObjectId(id),
      teamId: new Types.ObjectId(dto.teamId),
      teamName: dto.teamName,
      teamAbbreviation: dto.teamAbbreviation,
      group: dto.group?.toUpperCase(),
    });

    this.logger.log(`Team "${dto.teamName}" registered in tournament ${id}`);
    return updated!;
  }

  async updateTeamRegistration(
    id: string,
    teamId: string,
    dto: UpdateTeamRegistrationDto,
    user: RequestUser,
  ): Promise<TournamentDocument> {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundException(`Tournament ${id} not found`);
    this.checkAccess(t, user);

    const teamEntry = t.teams.find((team) => team.teamId.toString() === teamId);
    if (!teamEntry) {
      throw new NotFoundException(`Team ${teamId} not found in tournament`);
    }

    const updated = await this.repo.updateTeam(id, teamId, dto as any);
    return updated!;
  }

  async removeTeam(
    id: string,
    teamId: string,
    user: RequestUser,
  ): Promise<{ message: string }> {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundException(`Tournament ${id} not found`);
    this.checkAccess(t, user);

    if (t.status === TournamentStatus.ACTIVE) {
      throw new BadRequestException(
        'Cannot remove teams from an active tournament',
      );
    }

    await this.repo.removeTeam(id, teamId);
    this.logger.log(`Team ${teamId} removed from tournament ${id}`);
    return { message: 'Team removed successfully' };
  }

  async assignGroups(
    id: string,
    dto: AssignGroupsDto,
    user: RequestUser,
  ): Promise<TournamentDocument> {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundException(`Tournament ${id} not found`);
    this.checkAccess(t, user);

    if (
      t.format !== TournamentFormat.GROUP_STAGE &&
      t.format !== TournamentFormat.GROUP_KNOCKOUT
    ) {
      throw new BadRequestException(
        'Group assignment only applies to group stage tournaments',
      );
    }

    // Apply all group assignments
    await Promise.all(
      dto.assignments.map(({ teamId, group }) =>
        this.repo.updateTeam(id, teamId, { group: group.toUpperCase() }),
      ),
    );

    // Update standings with group
    await Promise.all(
      dto.assignments.map(({ teamId, group }) =>
        this.repo.upsertStanding(id, teamId, { group: group.toUpperCase() }),
      ),
    );

    this.logger.log(
      `Groups assigned for tournament ${id}: ${dto.assignments.length} teams`,
    );
    return (await this.repo.findById(id))!;
  }

  // ══════════════════════════════════════════════════════════════
  // BRACKET
  // ══════════════════════════════════════════════════════════════

  async generateBracket(
    id: string,
    user: RequestUser,
  ): Promise<{ message: string; matches: number }> {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundException(`Tournament ${id} not found`);
    this.checkAccess(t, user);

    if (t.registeredTeams < 2) {
      throw new BadRequestException(
        'Need at least 2 teams to generate bracket',
      );
    }

    // Clear existing bracket
    await this.repo.deleteBracket(id);

    const confirmedTeams = t.teams.filter(
      (team) =>
        team.status === TournamentTeamStatus.REGISTERED ||
        team.status === TournamentTeamStatus.CONFIRMED,
    );

    // Sort by seed
    confirmedTeams.sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));

    const matches: any[] = [];

    if (
      t.format === TournamentFormat.SINGLE_ELIMINATION ||
      t.format === TournamentFormat.DOUBLE_ELIMINATION
    ) {
      // Build single elimination bracket
      let roundTeams = [...confirmedTeams];
      let roundNumber = 1;

      while (roundTeams.length > 1) {
        const roundMatches: any[] = [];
        const nextRoundTeams: any[] = [];

        for (let i = 0; i < roundTeams.length; i += 2) {
          const teamA = roundTeams[i];
          const teamB = roundTeams[i + 1];

          const match: any = {
            tournamentId: new Types.ObjectId(id),
            round: this.getRoundName(roundTeams.length, i),
            roundNumber,
            matchNumber: Math.floor(i / 2) + 1,
            status: BracketMatchStatus.PENDING,
            teamA: teamA
              ? {
                  teamId: teamA.teamId,
                  teamName: teamA.teamName,
                  teamAbbreviation: teamA.teamAbbreviation,
                  score: 0,
                  isWinner: false,
                  isBye: false,
                }
              : { score: 0, isWinner: false, isBye: true },
          };

          if (teamB) {
            match.teamB = {
              teamId: teamB.teamId,
              teamName: teamB.teamName,
              teamAbbreviation: teamB.teamAbbreviation,
              score: 0,
              isWinner: false,
              isBye: false,
            };
          } else {
            // Bye — teamA advances automatically
            match.teamB = { score: 0, isWinner: false, isBye: true };
            match.winnerId = teamA.teamId;
            match.winnerName = teamA.teamName;
            match.status = BracketMatchStatus.WALKOVER;
            nextRoundTeams.push(teamA);
          }

          roundMatches.push(match);
        }

        matches.push(...roundMatches);
        roundTeams = nextRoundTeams;
        roundNumber++;
      }
    } else if (t.format === TournamentFormat.ROUND_ROBIN) {
      // Every team plays every other team
      let matchNumber = 1;
      for (let i = 0; i < confirmedTeams.length; i++) {
        for (let j = i + 1; j < confirmedTeams.length; j++) {
          matches.push({
            tournamentId: new Types.ObjectId(id),
            round: BracketRound.CUSTOM,
            roundLabel: `Match ${matchNumber}`,
            roundNumber: 1,
            matchNumber: matchNumber++,
            status: BracketMatchStatus.PENDING,
            teamA: {
              teamId: confirmedTeams[i].teamId,
              teamName: confirmedTeams[i].teamName,
              score: 0,
              isWinner: false,
              isBye: false,
            },
            teamB: {
              teamId: confirmedTeams[j].teamId,
              teamName: confirmedTeams[j].teamName,
              score: 0,
              isWinner: false,
              isBye: false,
            },
          });
        }
      }
    }

    if (matches.length > 0) {
      await this.repo.createManyBracketMatches(matches);
    }

    this.logger.log(
      `Bracket generated for tournament ${id}: ${matches.length} matches`,
    );
    return {
      message: 'Bracket generated successfully',
      matches: matches.length,
    };
  }

  async getBracket(
    id: string,
    filters: { round?: string; group?: string; roundNumber?: number },
    user: RequestUser,
  ) {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundException(`Tournament ${id} not found`);

    const bracket = await this.repo.findBracket(id, filters);

    // Group by round for frontend convenience
    const grouped: Record<string, any[]> = {};
    bracket.forEach((match) => {
      const key = match.roundLabel ?? match.round;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(match);
    });

    return { tournamentId: id, rounds: grouped, total: bracket.length };
  }

  async addBracketMatch(
    id: string,
    dto: CreateBracketMatchDto,
    user: RequestUser,
  ) {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundException(`Tournament ${id} not found`);
    this.checkAccess(t, user);

    return this.repo.createBracketMatch({
      tournamentId: new Types.ObjectId(id),
      round: dto.round,
      roundLabel: dto.roundLabel,
      roundNumber: dto.roundNumber,
      matchNumber: dto.matchNumber,
      group: dto.group?.toUpperCase(),
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      matchId: dto.matchId ? new Types.ObjectId(dto.matchId) : undefined,
      nextMatchId: dto.nextMatchId
        ? new Types.ObjectId(dto.nextMatchId)
        : undefined,
      loserNextMatchId: dto.loserNextMatchId
        ? new Types.ObjectId(dto.loserNextMatchId)
        : undefined,
      status: BracketMatchStatus.PENDING,
      teamA: {
        teamId: dto.teamAId ? new Types.ObjectId(dto.teamAId) : undefined,
        teamName: dto.teamAName,
        teamAbbreviation: dto.teamAAbbreviation,
        score: 0,
        isWinner: false,
        isBye: false,
      },
      teamB: {
        teamId: dto.teamBId ? new Types.ObjectId(dto.teamBId) : undefined,
        teamName: dto.teamBName,
        teamAbbreviation: dto.teamBAbbreviation,
        score: 0,
        isWinner: false,
        isBye: false,
      },
    });
  }

  async updateBracketMatch(
    id: string,
    matchId: string,
    dto: UpdateBracketMatchDto,
    user: RequestUser,
  ) {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundException(`Tournament ${id} not found`);
    this.checkAccess(t, user);

    const match = await this.repo.findBracketById(matchId);
    if (!match) {
      throw new NotFoundException(`Bracket match ${matchId} not found`);
    }

    const payload: Record<string, any> = {};

    if (dto.teamAScore !== undefined) payload['teamA.score'] = dto.teamAScore;
    if (dto.teamBScore !== undefined) payload['teamB.score'] = dto.teamBScore;
    if (dto.status) payload['status'] = dto.status;
    if (dto.notes) payload['notes'] = dto.notes;
    if (dto.matchId) payload['matchId'] = new Types.ObjectId(dto.matchId);
    if (dto.scheduledAt) payload['scheduledAt'] = new Date(dto.scheduledAt);

    // Set winner
    if (dto.winnerId) {
      payload['winnerId'] = new Types.ObjectId(dto.winnerId);
      payload['winnerName'] = dto.winnerName;
      payload['status'] = BracketMatchStatus.COMPLETED;

      // Mark winner flag on team entry
      if (match.teamA.teamId?.toString() === dto.winnerId) {
        payload['teamA.isWinner'] = true;
        payload['teamB.isWinner'] = false;
      } else {
        payload['teamA.isWinner'] = false;
        payload['teamB.isWinner'] = true;
      }
    }

    const updated = await this.repo.updateBracketMatch(matchId, {
      $set: payload,
    });

    this.logger.log(`Bracket match ${matchId} updated in tournament ${id}`);
    return updated;
  }

  // ══════════════════════════════════════════════════════════════
  // STANDINGS
  // ══════════════════════════════════════════════════════════════

  async getStandings(id: string, group?: string, user?: RequestUser) {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundException(`Tournament ${id} not found`);

    const standings = await this.repo.findStandings(id, group);
    return { tournamentId: id, group, standings };
  }

  async updateStanding(id: string, dto: UpdateStandingDto, user: RequestUser) {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundException(`Tournament ${id} not found`);
    this.checkAccess(t, user);

    const data: Record<string, any> = {
      tournamentId: new Types.ObjectId(id),
      teamId: new Types.ObjectId(dto.teamId),
      teamName: dto.teamName,
      teamAbbreviation: dto.teamAbbreviation,
    };

    const fields = [
      'group',
      'played',
      'won',
      'drawn',
      'lost',
      'points',
      'goalsFor',
      'goalsAgainst',
    ];
    fields.forEach((f) => {
      if ((dto as any)[f] !== undefined) data[f] = (dto as any)[f];
    });

    const standing = await this.repo.upsertStanding(id, dto.teamId, data);

    // Recalculate positions after update
    await this.repo.recalculatePositions(id);

    return standing;
  }

  async addResultToStanding(
    id: string,
    teamId: string,
    result: 'W' | 'D' | 'L',
    goalsFor: number,
    goalsAgainst: number,
    user: RequestUser,
  ) {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundException(`Tournament ${id} not found`);
    this.checkAccess(t, user);

    // Use the new repository method instead of direct access
    await this.repo.updateStandingWithInc(id, teamId, {
      result,
      goalsFor,
      goalsAgainst,
    });

    await this.repo.recalculatePositions(id);
    this.logger.log(`Standing updated for team ${teamId} in tournament ${id}`);

    return this.getStandings(id, undefined, user);
  }

  // ── Stats ─────────────────────────────────────────────────────
  async getStats(user: RequestUser) {
    const base = user.isSuperAdmin
      ? {}
      : { createdBy: new Types.ObjectId(user._id) };

    const [total, active, completed, upcoming] = await Promise.all([
      this.repo.count(base),
      this.repo.count({ ...base, status: TournamentStatus.ACTIVE }),
      this.repo.count({ ...base, status: TournamentStatus.COMPLETED }),
      this.repo.count({ ...base, status: TournamentStatus.UPCOMING }),
    ]);

    return { total, active, completed, upcoming };
  }

  // ── Helpers ───────────────────────────────────────────────────
  private getRoundName(totalTeams: number, matchIndex: number): BracketRound {
    if (totalTeams <= 2) return BracketRound.FINAL;
    if (totalTeams <= 4) return BracketRound.SEMI_FINAL;
    if (totalTeams <= 8) return BracketRound.QUARTER_FINAL;
    if (totalTeams <= 16) return BracketRound.ROUND_OF_16;
    if (totalTeams <= 32) return BracketRound.ROUND_OF_32;
    return BracketRound.ROUND_OF_64;
  }

  private checkAccess(t: TournamentDocument, user: RequestUser): void {
    if (user.isSuperAdmin) return;
    if (user.role === UserRole.ADMIN) return;
    if (t.createdBy.toString() === user._id) return;
    throw new ForbiddenException('You do not have access to this tournament');
  }
}
