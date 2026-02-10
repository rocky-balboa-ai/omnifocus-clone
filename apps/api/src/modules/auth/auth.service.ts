import { Injectable, UnauthorizedException, BadRequestException, ConflictException, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
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
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  // 2 months in seconds
  private readonly TOKEN_EXPIRY = 60 * 24 * 60 * 60; // 60 days

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    await this.getOrCreateDefaultUser();
    this.logger.log('Default user ensured');
  }

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

  async updateProfile(userId: string, data: { username: string }) {
    if (!data.username || data.username.trim().length < 3) {
      throw new BadRequestException('Username must be at least 3 characters');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (data.username !== currentUser!.username) {
      const existing = await this.prisma.user.findUnique({
        where: { username: data.username },
      });
      if (existing) {
        throw new ConflictException('Username already taken');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { username: data.username },
      select: { id: true, username: true },
    });
  }

  async changePassword(userId: string, data: { currentPassword: string; newPassword: string }) {
    if (!data.newPassword || data.newPassword.length < 3) {
      throw new BadRequestException('New password must be at least 3 characters');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true };
  }

  private generateApiKey(): string {
    return 'sk_' + randomBytes(24).toString('hex');
  }

  private maskApiKey(key: string): string {
    if (key.length <= 6) return key;
    const prefix = key.substring(0, 3);
    const suffix = key.substring(key.length - 3);
    return `${prefix}***...${suffix}`;
  }

  async getUserApiKey(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, apiKey: true },
    });

    if (!user!.apiKey) {
      const newKey = this.generateApiKey();
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: { apiKey: newKey },
        select: { id: true, apiKey: true },
      });
      return { maskedKey: this.maskApiKey(updated.apiKey!) };
    }

    return { maskedKey: this.maskApiKey(user!.apiKey) };
  }

  async revealUserApiKey(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, apiKey: true },
    });

    if (!user!.apiKey) {
      const newKey = this.generateApiKey();
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: { apiKey: newKey },
        select: { id: true, apiKey: true },
      });
      return { apiKey: updated.apiKey! };
    }

    return { apiKey: user!.apiKey };
  }

  async regenerateUserApiKey(userId: string) {
    const newKey = this.generateApiKey();
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { apiKey: newKey },
      select: { id: true, apiKey: true },
    });
    return { apiKey: updated.apiKey };
  }

  // ============================================================================
  // Bot Settings
  // ============================================================================

  async getBotSettings(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, botName: true, botApiKey: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      botName: user.botName,
      maskedBotApiKey: user.botApiKey ? this.maskApiKey(user.botApiKey) : null,
    };
  }

  async updateBotSettings(userId: string, data: { botName: string }) {
    if (!data.botName || data.botName.trim().length < 1) {
      throw new BadRequestException('Bot name cannot be empty');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { botName: data.botName.trim() },
      select: { id: true, botName: true },
    });

    return { botName: updated.botName };
  }

  async getBotApiKey(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, botApiKey: true },
    });

    if (!user!.botApiKey) {
      const newKey = this.generateApiKey();
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: { botApiKey: newKey },
        select: { id: true, botApiKey: true },
      });
      return { maskedKey: this.maskApiKey(updated.botApiKey!) };
    }

    return { maskedKey: this.maskApiKey(user!.botApiKey) };
  }

  async revealBotApiKey(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, botApiKey: true },
    });

    if (!user!.botApiKey) {
      const newKey = this.generateApiKey();
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: { botApiKey: newKey },
        select: { id: true, botApiKey: true },
      });
      return { botApiKey: updated.botApiKey! };
    }

    return { botApiKey: user!.botApiKey };
  }

  async regenerateBotApiKey(userId: string) {
    const newKey = this.generateApiKey();
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { botApiKey: newKey },
      select: { id: true, botApiKey: true },
    });
    return { botApiKey: updated.botApiKey };
  }
}
