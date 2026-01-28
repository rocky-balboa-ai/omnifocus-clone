import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
    // Connect lazily in background - don't block app startup
    this.connectInBackground();
  }

  private async connectInBackground() {
    // Small delay to let the app start first
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const maxRetries = 5;
    const baseDelay = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Background: Attempting database connection (attempt ${attempt}/${maxRetries})...`);
        await this.$connect();
        this.logger.log('Background: Database connection established');
        return;
      } catch (error) {
        this.logger.warn(`Background: Connection attempt ${attempt} failed: ${error.message}`);
        if (attempt === maxRetries) {
          this.logger.error('Background: All connection attempts failed');
          return;
        }
        const delay = baseDelay * Math.pow(2, attempt - 1);
        this.logger.log(`Background: Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
