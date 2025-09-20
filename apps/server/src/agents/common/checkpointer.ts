import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

/**
 * Configuration for PostgreSQL Checkpointer
 */
export interface CheckpointerConfig {
  url: string;
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
 * Environment variables required for PostgreSQL checkpointer
 */
export const REQUIRED_ENV_VARS = ['DATABASE_URL'] as const;

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
 * PostgreSQL checkpointer for conversation persistence
 * Uses the official @langchain/langgraph-checkpoint-postgres package
 */
export class CommonCheckpointer {
  private postgresSaver: PostgresSaver;
  private isInitialized = false;

  constructor() {
    validateCheckpointerConfig();
    const config = getCheckpointerConfig();
    this.postgresSaver = PostgresSaver.fromConnString(config?.url);
  }

  /**
   * Initialize the checkpointer (required before first use)
   */
  async initialize(): Promise<void> {
    if (!this.isInitialized) {
      try {
        await this.postgresSaver.setup();
        this.isInitialized = true;
        console.log('✅ PostgreSQL checkpointer initialized successfully');
      } catch (error) {
        console.error(
          '❌ Failed to initialize PostgreSQL checkpointer:',
          error
        );
        throw error;
      }
    }
  }

  /**
   * Get the underlying PostgresSaver instance
   */
  getPostgresSaver(): PostgresSaver {
    return this.postgresSaver;
  }
}

/**
 * Factory function to create a PostgreSQL checkpointer instance
 */
export async function createCheckpointer(): Promise<CommonCheckpointer> {
  const checkpointer = new CommonCheckpointer();
  await checkpointer.initialize();
  return checkpointer;
}
