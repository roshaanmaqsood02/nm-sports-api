import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../users/enums/user.enum';

export class AssignRoleDto {
  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId()
  userId!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.MANAGER })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;
}
