import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CheckpointerService } from '../checkpointer';
import { CacheService } from '../cache';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly checkpointerService: CheckpointerService,
    private readonly cacheService: CacheService,
  ) {}

  async onModuleInit(): Promise<void> {
    // The checkpointer is automatically initialized by CheckpointerService
    // This method demonstrates how to verify the checkpointer is ready
    if (this.checkpointerService.isReady()) {
      this.logger.log('✅ Checkpointer is ready and available');
    } else {
      this.logger.warn('⚠️ Checkpointer is not ready yet');
    }

    // Check Redis cache service status
    if (this.cacheService.isReady()) {
      this.logger.log('✅ Redis cache service is ready and available');
    } else {
      this.logger.warn('⚠️ Redis cache service is not ready yet');
    }
  }
  getAppInfo() {
    return {
      name: 'Quark Chat API',
      version: '1.0.0',
      description:
        'A NestJS backend for the Quark chat application',
      environment: process.env.NODE_ENV || 'development',
      docsUrl: process.env.NODE_ENV !== 'production' ? '/api/docs' : null,
    };
  }

  getHealthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'healthy', // TODO: Add actual database health check
        configured: true,
      },
      checkpointer: {
        status: this.checkpointerService.isReady() ? 'ready' : 'not_ready',
        initialized: this.checkpointerService.isReady(),
      },
      cache: {
        status: this.cacheService.isReady() ? 'ready' : 'not_ready',
        initialized: this.cacheService.isReady(),
      },
    };
  }
}
