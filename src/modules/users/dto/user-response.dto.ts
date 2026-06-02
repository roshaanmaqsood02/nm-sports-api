import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../enums/user.enum';

export class UserProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  lastName?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  phone?: string;

  @ApiPropertyOptional({ example: 'https://cdn.nmsports.com/avatar.jpg' })
  avatar?: string;
}

export class UserResponseDto {
  @ApiProperty({ example: '64abc123def456' })
  _id!: string;

  @ApiProperty({ example: 'john.doe@nmsports.com' })
  email!: string;

  @ApiProperty({ example: 'johndoe' })
  username!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.MEMBER })
  role!: UserRole;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status!: UserStatus;

  @ApiProperty({ example: false })
  isSuperAdmin!: boolean;

  @ApiProperty({ example: false })
  isEmailVerified!: boolean;

  @ApiProperty({ example: false })
  isTwoFactorEnabled!: boolean;

  @ApiPropertyOptional({ type: () => UserProfileDto })
  profile?: UserProfileDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PaginatedUsersDto {
  @ApiProperty({ type: [UserResponseDto] })
  data!: UserResponseDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 10 })
  totalPages!: number;
}
