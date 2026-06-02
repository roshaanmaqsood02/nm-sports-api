import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DivisionType, DivisionStatus } from '../enums/division.enum';

export class DivisionResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() shortName!: string;
  @ApiProperty() abbreviation!: string;
  @ApiProperty({ enum: DivisionType }) type!: DivisionType;
  @ApiProperty() organizationId!: string;
  @ApiPropertyOptional() primaryColor?: string;
  @ApiPropertyOptional() secondaryColor?: string;
  @ApiProperty({ enum: DivisionStatus }) status!: DivisionStatus;
  @ApiProperty() createdBy!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedDivisionsDto {
  @ApiProperty({ type: [DivisionResponseDto] }) data!: DivisionResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}
