import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from '../users/users.repository';
import { UserDocumentWithPrivate } from '../users/schema/user.schema';
import { UserDocument } from '../users/schema/user.schema';
import { UserStatus } from '../users/enums/user.enum';
import type {
  JwtPayload,
  JwtRefreshPayload,
} from './interfaces/jwt-payload.interface';
import type { LoginDto } from './dto/login.dto';
import type { AuthResponseDto, TokensDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserDocumentWithPrivate | null> {
    const user = (await this.usersRepository.findOneWithPassword({
      email,
    })) as UserDocumentWithPrivate | null;

    if (!user) return null;

    if (user.isLocked()) {
      const lockMins = Math.ceil(
        (user.security.lockUntil!.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Account locked due to too many failed attempts. Try again in ${lockMins} minute(s).`,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      this.logger.warn(`Failed login attempt for: ${email}`);
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto, ip?: string): Promise<AuthResponseDto> {
    const user = (await this.usersRepository.findOneWithPassword({
      email: loginDto.email.toLowerCase(),
    })) as UserDocumentWithPrivate | null;

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.isLocked()) {
      const lockMins = Math.ceil(
        (user.security.lockUntil!.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Account locked. Try again in ${lockMins} minute(s).`,
      );
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Your account has been suspended');
    }
    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException('Your account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      this.logger.warn(`❌ Failed login for ${loginDto.email} from ${ip}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user);

    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);
    await this.usersRepository.update(
      { _id: user._id },
      {
        $set: {
          refreshToken: hashedRefresh,
          'security.loginAttempts': 0,
          'security.lockUntil': null,
          'security.lastLoginAt': new Date(),
          'security.lastLoginIp': ip ?? 'unknown',
          status: UserStatus.ACTIVE,
        },
      },
    );

    this.logger.log(`Login success: ${user.email} from ${ip}`);

    return {
      user: this.sanitizeUser(user),
      tokens,
      message: 'Login successful',
    };
  }

  async refreshTokens(
    userId: string,
    rawRefreshToken: string,
  ): Promise<{ tokens: TokensDto; message: string }> {
    const user = (await this.usersRepository.findOneWithPassword({
      _id: userId,
    })) as UserDocumentWithPrivate | null;

    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Access denied — please login again');
    }

    const isMatch = await bcrypt.compare(rawRefreshToken, user.refreshToken);
    if (!isMatch) {
      throw new ForbiddenException(
        'Invalid refresh token — please login again',
      );
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Account suspended');
    }

    const tokens = await this.generateTokens(user);

    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);
    await this.usersRepository.update(
      { _id: user._id },
      { $set: { refreshToken: hashedRefresh } },
    );

    this.logger.log(`Token rotated for: ${user.email}`);

    return { tokens, message: 'Tokens refreshed successfully' };
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.usersRepository.update(
      { _id: userId },
      { $unset: { refreshToken: 1 } },
    );
    this.logger.log(`Logout: userId ${userId}`);
    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return this.sanitizeUser(user);
  }

  private async generateTokens(
    user: UserDocumentWithPrivate,
  ): Promise<TokensDto> {
    const accessPayload: JwtPayload = {
      sub: (user._id as any).toString(),
      email: user.email,
      username: user.username,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      permissions: user.permissions,
      type: 'access',
    };

    const refreshPayload: JwtRefreshPayload = {
      sub: (user._id as any).toString(),
      email: user.email,
      type: 'refresh',
    };

    const accessExpiresIn = parseInt(
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN_SECONDS', '900'),
      10,
    );
    const refreshExpiresIn = parseInt(
      this.configService.get<string>(
        'JWT_REFRESH_EXPIRES_IN_SECONDS',
        '604800',
      ),
      10,
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiresIn,
    };
  }

  private sanitizeUser(user: UserDocument | UserDocumentWithPrivate): any {
    const obj = user.toJSON();
    delete obj['password'];
    delete obj['refreshToken'];
    delete obj['security'];
    return obj;
  }
}
