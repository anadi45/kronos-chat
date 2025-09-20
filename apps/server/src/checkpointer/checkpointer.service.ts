import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { ConfigService } from '@nestjs/config';

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
export class CheckpointerService implements OnModuleInit {
  private readonly logger = new Logger(CheckpointerService.name);
  private postgresSaver: PostgresSaver;
  private isInitialized = false;

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

    this.postgresSaver = PostgresSaver.fromConnString(databaseUrl);

    await this.postgresSaver.setup();
    this.isInitialized = true;
  }

  /**
   * Get the underlying PostgresSaver instance
   * @returns PostgresSaver instance
   */
  getPostgresSaver(): PostgresSaver {
    if (!this.isInitialized) {
      throw new Error('CheckpointerService has not been initialized yet');
    }
    return this.postgresSaver;
  }

  /**
   * Check if the checkpointer is initialized
   * @returns boolean indicating initialization status
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}
