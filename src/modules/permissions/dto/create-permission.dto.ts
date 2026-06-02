import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'users:create',
    description: 'Permission name in resource:action format',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z_]+:[a-z_]+$/, {
    message:
      'Permission name must be in format resource:action (e.g. users:create)',
  })
  name!: string;

  @ApiProperty({ example: 'users' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  resource!: string;

  @ApiProperty({ example: 'create' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  action!: string;

  @ApiProperty({ example: 'Allows creating new users' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  description!: string;

  @ApiPropertyOptional({ example: 'Users' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  group?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}
