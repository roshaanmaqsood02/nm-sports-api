import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EventStatus,
  EventType,
  EventVisibility,
  RepeatFrequency,
} from '../enums/event.enum';

export class EventVenueResponseDto {
  @ApiProperty() name!: string;
  @ApiPropertyOptional() street?: string;
  @ApiPropertyOptional() city?: string;
  @ApiPropertyOptional() state?: string;
  @ApiPropertyOptional() country?: string;
  @ApiPropertyOptional() fullAddress?: string;
}

export class RepeatConfigResponseDto {
  @ApiProperty() enabled!: boolean;
  @ApiPropertyOptional({ enum: RepeatFrequency }) frequency?: RepeatFrequency;
  @ApiProperty() interval!: number;
  @ApiProperty() daysOfWeek!: number[];
  @ApiPropertyOptional() endsOn?: Date;
  @ApiPropertyOptional() endsAfterOccurrences?: number;
}

export class EventTeamDetailResponseDto {
  @ApiPropertyOptional() arrivalTime?: string;
  @ApiPropertyOptional() uniformDetail?: string;
  @ApiPropertyOptional() notes?: string;
}

export class EventResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() eventName!: string;
  @ApiProperty({ enum: EventType }) eventType!: EventType;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() organizationId!: string;
  @ApiProperty() teamIds!: string[];
  @ApiProperty() teamNames!: string[];
  @ApiProperty({ type: () => EventVenueResponseDto })
  venue!: EventVenueResponseDto;
  @ApiProperty() isAllDay!: boolean;
  @ApiProperty() date!: Date;
  @ApiPropertyOptional() timeStart?: string;
  @ApiPropertyOptional() timeEnd?: string;
  @ApiProperty() timezone!: string;
  @ApiProperty() displayTime!: string;
  @ApiProperty({ type: () => RepeatConfigResponseDto })
  repeat!: RepeatConfigResponseDto;
  @ApiProperty({ type: () => EventTeamDetailResponseDto })
  teamDetail!: EventTeamDetailResponseDto;
  @ApiProperty({ enum: EventStatus }) status!: EventStatus;
  @ApiProperty({ enum: EventVisibility }) visibility!: EventVisibility;
  @ApiProperty() isUpcoming!: boolean;
  @ApiProperty() createdBy!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedEventsDto {
  @ApiProperty({ type: [EventResponseDto] }) data!: EventResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}
