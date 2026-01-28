import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    // Retry connection with exponential backoff
    const maxRetries = 5;
    const baseDelay = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Attempting database connection (attempt ${attempt}/${maxRetries})...`);
        await this.$connect();
        this.logger.log('Database connection established');
        return;
      } catch (error) {
        this.logger.warn(`Connection attempt ${attempt} failed: ${error.message}`);
        if (attempt === maxRetries) {
          this.logger.error('All connection attempts failed, starting without database');
          // Don't throw - let the app start and fail gracefully on queries
          return;
        }
        const delay = baseDelay * Math.pow(2, attempt - 1);
        this.logger.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
