import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'superadmin@nmsports.com',
    description: 'Registered email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'SuperAdmin@123',
    description: 'Account password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    example: '192.168.1.1',
    required: false,
    description: 'Client IP (auto-captured if omitted)',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;
}
