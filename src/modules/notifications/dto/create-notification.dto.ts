import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
} from '../enums/notification.enum';

export class CreateNotificationDto {
  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId()
  @IsNotEmpty()
  userId!: string;

  @ApiPropertyOptional({ example: 'john@nmsports.com' })
  @IsOptional()
  @IsString()
  userEmail?: string;

  @ApiPropertyOptional({ example: 'fcm_device_token_here' })
  @IsOptional()
  @IsString()
  deviceToken?: string;

  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.MATCH_SCHEDULED,
  })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({ example: 'Match Scheduled: Lions vs Kings' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'Your match is scheduled for Jan 15 at 3pm' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  body!: string;

  @ApiPropertyOptional({
    enum: NotificationChannel,
    isArray: true,
    example: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];

  @ApiPropertyOptional({
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({ example: '/matches/64abc123' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  actionUrl?: string;

  @ApiPropertyOptional({ example: 'View Match' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  actionLabel?: string;

  @ApiPropertyOptional({ example: { matchId: '64abc123', homeTeam: 'Lions' } })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ example: '64abc123def456' })
  @IsOptional()
  @IsMongoId()
  organizationId?: string;

  @ApiPropertyOptional({ example: '64abc123def457' })
  @IsOptional()
  @IsMongoId()
  teamId?: string;

  @ApiPropertyOptional({ example: '64abc123def458' })
  @IsOptional()
  @IsMongoId()
  matchId?: string;

  @ApiPropertyOptional({ example: '64abc123def459' })
  @IsOptional()
  @IsMongoId()
  tournamentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;
}

export class BroadcastNotificationDto extends CreateNotificationDto {
  @ApiProperty({
    example: ['64abc123def456', '64abc123def457'],
    description: 'Array of user IDs to send to',
  })
  @IsArray()
  @IsMongoId({ each: true })
  userIds!: string[];
}
