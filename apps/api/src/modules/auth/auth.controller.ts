import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Req,
  Res,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    username: string;
  }
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * JWT Login - Returns token with 2-month expiry
   * Use this for mobile apps
   */
  @Post('token')
  @HttpCode(HttpStatus.OK)
  async getToken(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.username, loginDto.password);
  }

  /**
   * Session Login - For web browser (also returns JWT for localStorage)
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ) {
    // Get token response which validates and returns JWT
    const tokenResponse = await this.authService.login(
      loginDto.username,
      loginDto.password,
    );

    // Also set session for cookie-based auth
    req.session.userId = tokenResponse.user.id;
    req.session.username = tokenResponse.user.username;

    return tokenResponse;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res() res: Response) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false });
      }
      res.clearCookie('connect.sid');
      return res.json({ success: true });
    });
  }

  /**
   * Get current user from JWT or session
   */
  @Get('me')
  async me(
    @Req() req: Request,
    @Headers('authorization') authHeader?: string,
  ) {
    // Check JWT first
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await this.authService.getUserFromToken(token);
      if (user) {
        return { authenticated: true, user };
      }
    }

    // Fall back to session
    if (req.session.userId) {
      return {
        authenticated: true,
        user: {
          id: req.session.userId,
          username: req.session.username,
        },
      };
    }

    return { authenticated: false };
  }

  private getUserId(req: Request): string {
    const user = (req as any).user;
    if (user?.id) return user.id;
    if (req.session?.userId) return req.session.userId;
    throw new UnauthorizedException('Not authenticated');
  }

  @Patch('profile')
  async updateProfile(
    @Req() req: Request,
    @Body() dto: UpdateProfileDto,
  ) {
    const userId = this.getUserId(req);
    return this.authService.updateProfile(userId, { username: dto.username });
  }

  @Patch('password')
  async changePassword(
    @Req() req: Request,
    @Body() dto: ChangePasswordDto,
  ) {
    const userId = this.getUserId(req);
    return this.authService.changePassword(userId, {
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });
  }

  @Get('api-key')
  async getApiKey(@Req() req: Request) {
    const userId = this.getUserId(req);
    return this.authService.getUserApiKey(userId);
  }

  @Get('api-key/reveal')
  async revealApiKey(@Req() req: Request) {
    const userId = this.getUserId(req);
    return this.authService.revealUserApiKey(userId);
  }

  @Post('api-key/regenerate')
  async regenerateApiKey(@Req() req: Request) {
    const userId = this.getUserId(req);
    return this.authService.regenerateUserApiKey(userId);
  }
}
