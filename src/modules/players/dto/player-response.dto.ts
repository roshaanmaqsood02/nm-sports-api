import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlayerStatus } from '../enums/player.enum';

export class OtherContactResponseDto {
  @ApiPropertyOptional() email?: string;
  @ApiPropertyOptional() phone?: string;
  @ApiPropertyOptional() emergencyContact?: string;
  @ApiPropertyOptional() emergencyPhone?: string;
}

export class PlayerResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty() organization!: string;
  @ApiProperty() team!: string;
  @ApiProperty({ isArray: true }) positions!: string[];
  @ApiPropertyOptional() number?: number;
  @ApiProperty({ enum: PlayerStatus }) status!: PlayerStatus;
  @ApiPropertyOptional() message?: string;
  @ApiProperty({ type: () => OtherContactResponseDto })
  otherContact!: OtherContactResponseDto;
  @ApiProperty() createdBy!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedPlayersDto {
  @ApiProperty({ type: [PlayerResponseDto] }) data!: PlayerResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}
