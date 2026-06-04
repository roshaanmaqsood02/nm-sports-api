import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CoachStatus, CoachRole } from '../enums/coach.enum';

export class CoachResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty() email!: string;
  @ApiPropertyOptional() jerseyNumber?: number;
  @ApiProperty() organizationId!: string;
  @ApiProperty() teamId!: string;
  @ApiPropertyOptional() teamName?: string;
  @ApiProperty({ enum: CoachRole }) coachRole!: CoachRole;
  @ApiPropertyOptional() userId?: string;
  @ApiProperty({ enum: CoachStatus }) status!: CoachStatus;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() createdBy!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedCoachesDto {
  @ApiProperty({ type: [CoachResponseDto] }) data!: CoachResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}
