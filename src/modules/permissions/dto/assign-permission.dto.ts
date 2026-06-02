import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsMongoId, IsString } from 'class-validator';

export class AssignPermissionsToUserDto {
  @ApiProperty({
    example: '64abc123def456',
    description: 'Target user MongoDB ID',
  })
  @IsMongoId()
  userId!: string;

  @ApiProperty({
    example: ['users:read', 'reports:export'],
    description: 'Array of permission names to assign',
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  permissions!: string[];
}

export class RevokePermissionsDto {
  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId()
  userId!: string;

  @ApiProperty({ example: ['reports:export'] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  permissions!: string[];
}
