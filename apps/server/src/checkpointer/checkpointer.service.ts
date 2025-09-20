import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

/**
 * Configuration for PostgreSQL Checkpointer
 */
export interface CheckpointerConfig {
  url: string;
}

/**
 * Environment variables required for PostgreSQL checkpointer
 */
export const REQUIRED_ENV_VARS = ['DATABASE_URL'] as const;

/**
 * NestJS service for PostgreSQL checkpointer management
 * Handles initialization and provides access to the PostgresSaver instance
 */
@Injectable()
export class CheckpointerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CheckpointerService.name);
  private checkpointer: PostgresSaver;
  private isInitialized = false;
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize the checkpointer when the module starts
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.initialize();
      this.logger.log('✅ PostgreSQL checkpointer initialized successfully');
    } catch (error) {
      this.logger.error(
        '❌ Failed to initialize PostgreSQL checkpointer:',
        error
      );
      throw error;
    }
  }

  /**
   * Initialize the PostgreSQL checkpointer
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }

    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    // Create Checkpointer with the pool
    this.checkpointer = new PostgresSaver(this.pool);

    await this.checkpointer.setup();
    this.isInitialized = true;
  }

  /**
   * Get the underlying Checkpointer instance
   * @returns PostgresSaver instance
   */
  getCheckpointer(): PostgresSaver {
    if (!this.isInitialized) {
      throw new Error('CheckpointerService has not been initialized yet');
    }
    return this.checkpointer;
  }

  /**
   * Check if the checkpointer is initialized
   * @returns boolean indicating initialization status
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup resources when the service is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('✅ PostgreSQL pool connection closed');
    }
  }
}
