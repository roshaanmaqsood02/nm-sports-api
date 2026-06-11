import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  EventStatus,
  EventType,
  EventVisibility,
  RepeatFrequency,
} from '../enums/event.enum';

export class EventVenueDto {
  @ApiProperty({ example: 'NMSports Arena' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ example: '123 Main Street' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  street?: string;

  @ApiPropertyOptional({ example: 'Lahore' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Punjab' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  state?: string;

  @ApiPropertyOptional({ example: 'Pakistan' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ example: '54000' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zip?: string;

  @ApiPropertyOptional({
    example: 'NMSports Arena, 123 Main Street, Lahore, Punjab, Pakistan',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fullAddress?: string;
}

export class RepeatConfigDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled!: boolean;

  @ApiPropertyOptional({
    enum: RepeatFrequency,
    description: 'daily | weekly | monthly | yearly | custom',
  })
  @IsOptional()
  @IsEnum(RepeatFrequency)
  frequency?: RepeatFrequency;

  @ApiPropertyOptional({
    example: 1,
    description: 'Every N units e.g. every 2 weeks',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  interval?: number;

  @ApiPropertyOptional({
    example: [1, 3, 5],
    description: '0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  daysOfWeek?: number[];

  @ApiPropertyOptional({
    example: '2024-10-14',
    description: 'Repeat ends on this date (e.g. 10/14/2024)',
  })
  @IsOptional()
  @IsDateString()
  endsOn?: string;

  @ApiPropertyOptional({ example: 10, description: 'Ends after N occurrences' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  endsAfterOccurrences?: number;
}

export class EventTeamDetailDto {
  @ApiPropertyOptional({
    example: '8:30 AM',
    description: 'Arrival time (optional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  arrivalTime?: string;

  @ApiPropertyOptional({
    example: 'Blue jersey, white shorts',
    description: 'Uniform detail (optional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  uniformDetail?: string;

  @ApiPropertyOptional({
    example: 'Bring your own water bottle.',
    description: 'Notes (optional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class CreateEventDto {
  @ApiProperty({ example: 'Pre-Season Training Camp' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  eventName!: string;

  @ApiPropertyOptional({ enum: EventType, default: EventType.TRAINING })
  @IsOptional()
  @IsEnum(EventType)
  eventType?: EventType;

  @ApiPropertyOptional({
    example: 'Annual pre-season training for all squads.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @ApiPropertyOptional({
    example: ['64abc123def457', '64abc123def458'],
    description: 'Team IDs attached to this event',
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  teamIds?: string[];

  @ApiPropertyOptional({ example: ['Lahore Lions', 'Karachi Kings'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  teamNames?: string[];

  @ApiProperty({ type: () => EventVenueDto })
  @ValidateNested()
  @Type(() => EventVenueDto)
  venue!: EventVenueDto;

  @ApiProperty({ example: false, description: 'Is this an all-day event?' })
  @IsBoolean()
  isAllDay!: boolean;

  @ApiProperty({
    example: '2025-06-15',
    description: 'Event date (YYYY-MM-DD)',
  })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({
    example: '9:00 AM',
    description: 'Start time (ignored if isAllDay=true)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  timeStart?: string;

  @ApiPropertyOptional({ example: '5:00 PM', description: 'End time' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  timeEnd?: string;

  @ApiProperty({
    example: 'CDT',
    description: 'Timezone e.g. CDT, America/Chicago',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  timezone!: string;

  @ApiPropertyOptional({ type: () => RepeatConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RepeatConfigDto)
  repeat?: RepeatConfigDto;

  @ApiPropertyOptional({ type: () => EventTeamDetailDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventTeamDetailDto)
  teamDetail?: EventTeamDetailDto;

  @ApiPropertyOptional({ enum: EventStatus, default: EventStatus.UPCOMING })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({ enum: EventVisibility, default: EventVisibility.TEAM })
  @IsOptional()
  @IsEnum(EventVisibility)
  visibility?: EventVisibility;
}
