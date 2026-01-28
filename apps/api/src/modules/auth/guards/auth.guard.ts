import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // DEV MODE: Allow all requests in development
    if (this.config.get('NODE_ENV') === 'development') {
      return true;
    }

    // Check JWT Bearer token (preferred for mobile)
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = await this.authService.validateJwt(token);
      if (payload) {
        // Attach user info to request for downstream use
        (request as any).user = { id: payload.sub, username: payload.username };
        return true;
      }
    }

    // Check session auth (Fred - web fallback)
    if (request.session?.userId) {
      return true;
    }

    // Check API key auth (Rocky)
    const apiKey = request.headers['x-api-key'] as string;
    if (apiKey) {
      return this.authService.validateApiKey(apiKey);
    }

    return false;
  }
}
