import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'coach',
    description: 'Unique role slug (lowercase, underscores allowed)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'Role name must be lowercase alphanumeric with underscores',
  })
  name!: string;

  @ApiProperty({ example: 'Coach' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  displayName!: string;

  @ApiPropertyOptional({ example: 'Manages team coaching activities' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiPropertyOptional({
    example: ['teams:read', 'players:read', 'matches:read'],
    description: 'Permission names to attach to this role',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({
    example: 3,
    description: 'Hierarchy level (0 = highest authority)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  level?: number;
}
