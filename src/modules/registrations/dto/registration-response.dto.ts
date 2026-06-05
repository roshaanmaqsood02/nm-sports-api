import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RegistrationStatus } from '../enums/registration.enum';

export class RegistrationResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() referenceNumber!: string;
  @ApiPropertyOptional() organizationId?: string;
  @ApiProperty() submittedBy!: string;
  @ApiProperty() currentStep!: number;
  @ApiProperty({ enum: RegistrationStatus }) status!: RegistrationStatus;
  @ApiProperty() isComplete!: boolean;
  @ApiProperty() isRush!: boolean;
  @ApiPropertyOptional() step1?: any;
  @ApiPropertyOptional() step2?: any;
  @ApiPropertyOptional() step3?: any;
  @ApiPropertyOptional() step4?: any;
  @ApiPropertyOptional() step5?: any;
  @ApiPropertyOptional() adminNotes?: string;
  @ApiPropertyOptional() completedAt?: Date;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedRegistrationsDto {
  @ApiProperty({ type: [RegistrationResponseDto] })
  data!: RegistrationResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}
