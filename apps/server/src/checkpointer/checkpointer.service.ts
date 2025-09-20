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
      this.logger.error('❌ Failed to initialize PostgreSQL checkpointer:', error);
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
      this.logger.warn(
        '⚠️ DATABASE_URL not found in environment variables. ' +
        'Checkpointer may not work properly in production.'
      );
      // For development, you might want to construct the URL from individual components
      const host = this.configService.get<string>('DATABASE_HOST', 'localhost');
      const port = this.configService.get<number>('DATABASE_PORT', 5432);
      const username = this.configService.get<string>('DATABASE_USERNAME', 'kronos_user');
      const password = this.configService.get<string>('DATABASE_PASSWORD', 'kronos_password');
      const database = this.configService.get<string>('DATABASE_NAME', 'kronos_chat');
      
      const constructedUrl = `postgresql://${username}:${password}@${host}:${port}/${database}`;
      this.postgresSaver = PostgresSaver.fromConnString(constructedUrl);
    } else {
      this.postgresSaver = PostgresSaver.fromConnString(databaseUrl);
    }

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

/**
 * Get checkpointer configuration from environment variables
 */
export function getCheckpointerConfig(): CheckpointerConfig {
  return {
    url: process.env.DATABASE_URL,
  };
}

/**
 * Validate that all required environment variables are set
 */
export function validateCheckpointerConfig(): void {
  const missing = REQUIRED_ENV_VARS.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    console.warn(
      `⚠️ Missing environment variables for PostgreSQL checkpointer: ${missing.join(
        ', '
      )}`
    );
    console.warn(
      'Using default values. For production, please set all required environment variables.'
    );
  }
}

/**
 * Factory function to create a PostgreSQL checkpointer instance
 * @deprecated Use CheckpointerService with dependency injection instead
 */
export async function createCheckpointer(): Promise<CheckpointerService> {
  // This is kept for backward compatibility but should not be used in NestJS context
  throw new Error('Use CheckpointerService with dependency injection instead of createCheckpointer()');
}
