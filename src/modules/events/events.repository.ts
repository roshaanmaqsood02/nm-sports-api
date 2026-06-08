import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { Event, EventDocument } from './schemas/event.schema';

@Injectable()
export class EventsRepository extends BaseRepository<EventDocument> {
  constructor(
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
  ) {
    super(eventModel);
  }

  async findByIdPopulated(id: string): Promise<EventDocument | null> {
    return this.findById(id, [
      { path: 'organizationId', select: 'name acronym' },
      { path: 'teamIds', select: 'name shortName abbreviation' },
      { path: 'createdBy', select: 'email username' },
    ]);
  }

  async findByTeam(teamId: string): Promise<EventDocument[]> {
    return this.findAll({ teamIds: new Types.ObjectId(teamId) }, [
      { path: 'teamIds', select: 'name abbreviation' },
    ]);
  }

  async findInDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<EventDocument[]> {
    return this.findAll({
      organizationId: new Types.ObjectId(organizationId),
      date: { $gte: startDate, $lte: endDate },
    });
  }

  async addTeam(
    eventId: string,
    teamId: string,
    teamName: string,
  ): Promise<EventDocument | null> {
    return this.updateById(eventId, {
      $addToSet: {
        teamIds: new Types.ObjectId(teamId),
        teamNames: teamName,
      },
    });
  }

  async removeTeam(
    eventId: string,
    teamId: string,
    teamName: string,
  ): Promise<EventDocument | null> {
    return this.updateById(eventId, {
      $pull: {
        teamIds: new Types.ObjectId(teamId),
        teamNames: teamName,
      },
    });
  }
}
