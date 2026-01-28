import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  username: string;
}

export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
  user: { id: string; username: string };
}

@Injectable()
export class AuthService {
  // 2 months in seconds
  private readonly TOKEN_EXPIRY = 60 * 24 * 60 * 60; // 60 days

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { id: user.id, username: user.username };
  }

  async login(username: string, password: string): Promise<TokenResponse> {
    const user = await this.validateUser(username, password);

    const payload: JwtPayload = { sub: user.id, username: user.username };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.TOKEN_EXPIRY,
    });

    return {
      accessToken,
      expiresIn: this.TOKEN_EXPIRY,
      user,
    };
  }

  async validateJwt(token: string): Promise<JwtPayload | null> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      return payload;
    } catch {
      return null;
    }
  }

  async getUserFromToken(token: string) {
    const payload = await this.validateJwt(token);
    if (!payload) return null;

    return this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true },
    });
  }

  async validateApiKey(key: string): Promise<boolean> {
    // Check static API key from config
    const staticKey = this.config.get('API_KEY');
    if (staticKey && key === staticKey) {
      return true;
    }

    // Check database API keys
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { key },
    });

    if (apiKey) {
      // Update last used
      await this.prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsed: new Date() },
      });
      return true;
    }

    return false;
  }

  async createUser(username: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: { username, passwordHash },
      select: { id: true, username: true },
    });
  }

  async getOrCreateDefaultUser() {
    const defaultUsername = 'fred';
    let user = await this.prisma.user.findUnique({
      where: { username: defaultUsername },
    });

    if (!user) {
      // Create default user with password 'omnifocus'
      user = await this.prisma.user.create({
        data: {
          username: defaultUsername,
          passwordHash: await bcrypt.hash('omnifocus', 10),
        },
      });
    }

    return { id: user.id, username: user.username };
  }
}
