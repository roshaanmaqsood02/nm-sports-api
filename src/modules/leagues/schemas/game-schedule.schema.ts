import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { GameStatus } from '../enums/league.enum';

export type GameScheduleDocument = GameSchedule & Document;

@Schema({
  timestamps: true,
  collection: 'game_schedules',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class GameSchedule {
  @Prop({
    type: Types.ObjectId,
    ref: 'League',
    required: true,
    index: true,
  })
  leagueId!: Types.ObjectId;

  @Prop({ trim: true })
  season!: string;

  @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
  visitorTeamId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  visitorTeamName!: string;

  @Prop({ trim: true })
  visitorTeamAbbreviation?: string;

  @Prop({ default: 0 }) visitorScore!: number;

  @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
  homeTeamId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  homeTeamName!: string;

  @Prop({ trim: true })
  homeTeamAbbreviation?: string;

  @Prop({ default: 0 }) homeScore!: number;

  @Prop({ required: true, trim: true })
  location!: string;

  @Prop({ trim: true })
  arena?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  country?: string;

  @Prop({ required: true, index: true })
  scheduledAt!: Date;

  @Prop() startedAt?: Date;
  @Prop() endedAt?: Date;

  @Prop({
    type: String,
    enum: GameStatus,
    default: GameStatus.SCHEDULED,
    index: true,
  })
  status!: GameStatus;

  @Prop({ trim: true, maxlength: 300 })
  notes?: string;

  @Prop({ default: 0 }) visitorQ1!: number;
  @Prop({ default: 0 }) visitorQ2!: number;
  @Prop({ default: 0 }) visitorOT!: number;

  @Prop({ default: 0 }) homeQ1!: number;
  @Prop({ default: 0 }) homeQ2!: number;
  @Prop({ default: 0 }) homeOT!: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const GameScheduleSchema = SchemaFactory.createForClass(GameSchedule);

GameScheduleSchema.virtual('scoreline').get(function (
  this: GameScheduleDocument,
) {
  return `${this.visitorTeamName} ${this.visitorScore} - ${this.homeScore} ${this.homeTeamName}`;
});

GameScheduleSchema.index({ leagueId: 1, scheduledAt: -1 });
GameScheduleSchema.index({ leagueId: 1, status: 1 });
GameScheduleSchema.index({ visitorTeamId: 1, scheduledAt: -1 });
GameScheduleSchema.index({ homeTeamId: 1, scheduledAt: -1 });
GameScheduleSchema.index({ scheduledAt: -1 });
