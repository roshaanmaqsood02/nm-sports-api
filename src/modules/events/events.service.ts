import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { EventsRepository } from './events.repository';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventDocument } from './schemas/event.schema';
import { EventStatus } from './enums/event.enum';
import { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../users/enums/user.enum';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly repo: EventsRepository) {}

  // ── Create ────────────────────────────────────────────────────
  async create(dto: CreateEventDto, user: RequestUser): Promise<EventDocument> {
    const event = await this.repo.create({
      eventName: dto.eventName,
      eventType: dto.eventType,
      description: dto.description,
      organizationId: this.repo.toObjectId(dto.organizationId),
      teamIds: (dto.teamIds ?? []).map((id) => this.repo.toObjectId(id)),
      teamNames: dto.teamNames ?? [],
      venue: {
        name: dto.venue.name,
        street: dto.venue.street,
        city: dto.venue.city,
        state: dto.venue.state,
        country: dto.venue.country,
        zip: dto.venue.zip,
        fullAddress: dto.venue.fullAddress ?? this.buildFullAddress(dto.venue),
      },
      isAllDay: dto.isAllDay,
      date: new Date(dto.date),
      timeStart: dto.isAllDay ? undefined : dto.timeStart,
      timeEnd: dto.isAllDay ? undefined : dto.timeEnd,
      timezone: dto.timezone,
      repeat: dto.repeat
        ? {
            enabled: dto.repeat.enabled,
            frequency: dto.repeat.frequency,
            interval: dto.repeat.interval ?? 1,
            daysOfWeek: dto.repeat.daysOfWeek ?? [],
            endsOn: dto.repeat.endsOn ? new Date(dto.repeat.endsOn) : undefined,
            endsAfterOccurrences: dto.repeat.endsAfterOccurrences,
          }
        : { enabled: false, interval: 1, daysOfWeek: [] },
      teamDetail: {
        arrivalTime: dto.teamDetail?.arrivalTime,
        uniformDetail: dto.teamDetail?.uniformDetail,
        notes: dto.teamDetail?.notes,
      },
      status: dto.status ?? EventStatus.UPCOMING,
      visibility: dto.visibility,
      createdBy: user._id as any,
    });

    this.logger.log(`✅ Event created: "${event.eventName}" by ${user.email}`);
    return event;
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
      eventType?: string;
      isAllDay?: string;
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
    if (filters.teamId)
      filter['teamIds'] = this.repo.toObjectId(filters.teamId);
    if (filters.status) filter['status'] = filters.status;
    if (filters.eventType) filter['eventType'] = filters.eventType;
    if (filters.isAllDay !== undefined)
      filter['isAllDay'] = filters.isAllDay === 'true';

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
          ['eventName', 'description', 'venue.name', 'venue.city'],
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
        { path: 'teamIds', select: 'name abbreviation' },
      ],
    });
  }

  // ── Find One ──────────────────────────────────────────────────
  async findOne(id: string, user: RequestUser): Promise<EventDocument> {
    const event = await this.repo.findByIdPopulated(id);
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    return event;
  }

  // ── Find by Team ──────────────────────────────────────────────
  async findByTeam(
    teamId: string,
    user: RequestUser,
  ): Promise<EventDocument[]> {
    return this.repo.findByTeam(teamId);
  }

  // ── Update ────────────────────────────────────────────────────
  async update(
    id: string,
    dto: UpdateEventDto,
    user: RequestUser,
  ): Promise<EventDocument> {
    const event = await this.repo.findByIdPopulated(id);
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    this.checkAccess(event, user);

    const payload: Record<string, any> = {};
    const scalar = [
      'eventName',
      'eventType',
      'description',
      'isAllDay',
      'timeStart',
      'timeEnd',
      'timezone',
      'status',
      'visibility',
    ];
    scalar.forEach((f) => {
      if ((dto as any)[f] !== undefined) payload[f] = (dto as any)[f];
    });

    if (dto.date) payload['date'] = new Date(dto.date);
    if (dto.teamIds)
      payload['teamIds'] = dto.teamIds.map((id) => this.repo.toObjectId(id));
    if (dto.teamNames) payload['teamNames'] = dto.teamNames;

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

    if (dto.repeat) {
      payload['repeat.enabled'] = dto.repeat.enabled;
      if (dto.repeat.frequency)
        payload['repeat.frequency'] = dto.repeat.frequency;
      if (dto.repeat.interval) payload['repeat.interval'] = dto.repeat.interval;
      if (dto.repeat.daysOfWeek)
        payload['repeat.daysOfWeek'] = dto.repeat.daysOfWeek;
      if (dto.repeat.endsOn)
        payload['repeat.endsOn'] = new Date(dto.repeat.endsOn);
      if (dto.repeat.endsAfterOccurrences)
        payload['repeat.endsAfterOccurrences'] =
          dto.repeat.endsAfterOccurrences;
    }

    if (dto.teamDetail) {
      if (dto.teamDetail.arrivalTime !== undefined)
        payload['teamDetail.arrivalTime'] = dto.teamDetail.arrivalTime;
      if (dto.teamDetail.uniformDetail !== undefined)
        payload['teamDetail.uniformDetail'] = dto.teamDetail.uniformDetail;
      if (dto.teamDetail.notes !== undefined)
        payload['teamDetail.notes'] = dto.teamDetail.notes;
    }

    const updated = await this.repo.updateById(id, { $set: payload });
    this.logger.log(`Event updated: ${id}`);
    return updated!;
  }

  // ── Update Status ─────────────────────────────────────────────
  async updateStatus(
    id: string,
    status: EventStatus,
    user: RequestUser,
  ): Promise<EventDocument> {
    const event = await this.repo.findByIdPopulated(id);
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    this.checkAccess(event, user);
    return (await this.repo.updateById(id, { $set: { status } }))!;
  }

  // ── Team management ───────────────────────────────────────────
  async addTeam(
    id: string,
    teamId: string,
    teamName: string,
    user: RequestUser,
  ): Promise<EventDocument> {
    const event = await this.repo.findByIdPopulated(id);
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    this.checkAccess(event, user);
    return (await this.repo.addTeam(id, teamId, teamName))!;
  }

  async removeTeam(
    id: string,
    teamId: string,
    teamName: string,
    user: RequestUser,
  ): Promise<EventDocument> {
    const event = await this.repo.findByIdPopulated(id);
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    this.checkAccess(event, user);
    return (await this.repo.removeTeam(id, teamId, teamName))!;
  }

  // ── Delete ────────────────────────────────────────────────────
  async remove(id: string, user: RequestUser): Promise<{ message: string }> {
    const event = await this.repo.findByIdPopulated(id);
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    this.checkAccess(event, user);
    await this.repo.softDelete(id);
    return { message: 'Event deleted successfully' };
  }

  // ── Stats ─────────────────────────────────────────────────────
  async getStats(organizationId: string) {
    const base = { organizationId: this.repo.toObjectId(organizationId) };
    const [total, upcoming, completed, cancelled] = await Promise.all([
      this.repo.count(base),
      this.repo.count({
        ...base,
        status: EventStatus.UPCOMING,
        date: { $gte: new Date() },
      }),
      this.repo.count({ ...base, status: EventStatus.COMPLETED }),
      this.repo.count({ ...base, status: EventStatus.CANCELLED }),
    ]);
    return { total, upcoming, completed, cancelled };
  }

  // ── Helpers ───────────────────────────────────────────────────
  private buildFullAddress(venue: any): string {
    return [venue.name, venue.street, venue.city, venue.state, venue.country]
      .filter(Boolean)
      .join(', ');
  }

  private checkAccess(event: EventDocument, user: RequestUser): void {
    if (user.isSuperAdmin || user.role === UserRole.ADMIN) return;
    if (event.createdBy.toString() === user._id) return;
    throw new ForbiddenException('You do not have access to this event');
  }
}
