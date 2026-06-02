import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class TokensDto {
  @ApiProperty({ description: 'Short-lived JWT access token (15m)' })
  accessToken!: string;

  @ApiProperty({ description: 'Long-lived JWT refresh token (7d)' })
  refreshToken!: string;

  @ApiProperty({ example: 900, description: 'Access token TTL in seconds' })
  expiresIn!: number;
}

export class AuthResponseDto {
  @ApiProperty({ type: () => UserResponseDto })
  user!: UserResponseDto;

  @ApiProperty({ type: () => TokensDto })
  tokens!: TokensDto;

  @ApiProperty({ example: 'Login successful' })
  message!: string;
}

export class RefreshResponseDto {
  @ApiProperty({ type: () => TokensDto })
  tokens!: TokensDto;

  @ApiProperty({ example: 'Tokens refreshed successfully' })
  message!: string;
}
