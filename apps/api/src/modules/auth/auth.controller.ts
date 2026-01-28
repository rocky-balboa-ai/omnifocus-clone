import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

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
   * Session Login - For web browser (cookie-based)
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ) {
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );

    req.session.userId = user.id;
    req.session.username = user.username;

    return { success: true, user };
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
}
