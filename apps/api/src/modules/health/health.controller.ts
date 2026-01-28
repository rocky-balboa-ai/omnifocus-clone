import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    const now = new Date();

    // Check database connectivity
    let dbStatus = 'healthy';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'unhealthy';
    }

    return {
      status: dbStatus === 'healthy' ? 'ok' : 'degraded',
      timestamp: now.toISOString(),
      uptime: process.uptime(),
      checks: {
        database: dbStatus,
      },
    };
  }

  @Get('ready')
  async ready() {
    // Check if database is ready
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready' };
    } catch {
      return { status: 'not_ready' };
    }
  }

  @Get('live')
  live() {
    return { status: 'alive' };
  }
}
