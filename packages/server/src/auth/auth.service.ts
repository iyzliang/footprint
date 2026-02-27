import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities';
import { RegisterDto, LoginDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);

    const user = this.userRepository.create({
      email: dto.email,
      passwordHash,
      nickname: dto.nickname,
    });

    const saved = await this.userRepository.save(user);
    const tokens = this.generateTokens(saved);

    return {
      user: { id: saved.id, email: saved.email, nickname: saved.nickname },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.generateTokens(user);
    return {
      user: { id: user.id, email: user.email, nickname: user.nickname },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'footprint_jwt_refresh'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(user: User) {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      type: 'refresh',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.get<string>('JWT_SECRET', 'footprint_jwt_secret'),
      expiresIn: this.configService.get<number>('JWT_EXPIRES_IN_SECONDS', 86400),
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'footprint_jwt_refresh'),
      expiresIn: this.configService.get<number>('JWT_REFRESH_EXPIRES_IN_SECONDS', 604800),
    });

    return { accessToken, refreshToken };
  }
}
