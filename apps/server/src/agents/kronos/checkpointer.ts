import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import pg from 'pg';
import { getCheckpointerConfig, buildConnectionString, validateCheckpointerConfig } from './config';

const { Pool } = pg;

/**
 * PostgreSQL checkpointer for conversation persistence
 * Uses the official @langchain/langgraph-checkpoint-postgres package
 */
export class KronosCheckpointer {
  private postgresSaver: PostgresSaver;
  private isInitialized = false;

  constructor(connectionString?: string, pool?: pg.Pool) {
    if (pool) {
      this.postgresSaver = new PostgresSaver(pool);
    } else if (connectionString) {
      this.postgresSaver = PostgresSaver.fromConnString(connectionString);
    } else {
      // Use environment variables for connection
      validateCheckpointerConfig();
      const config = getCheckpointerConfig();
      const connectionString = buildConnectionString(config);
      this.postgresSaver = PostgresSaver.fromConnString(connectionString);
    }
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
        console.error('❌ Failed to initialize PostgreSQL checkpointer:', error);
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
export async function createKronosCheckpointer(
  connectionString?: string,
  pool?: pg.Pool
): Promise<KronosCheckpointer> {
  const checkpointer = new KronosCheckpointer(connectionString, pool);
  await checkpointer.initialize();
  return checkpointer;
}

/**
 * Create a checkpointer using a connection pool
 */
export async function createKronosCheckpointerWithPool(pool: pg.Pool): Promise<KronosCheckpointer> {
  return createKronosCheckpointer(undefined, pool);
}

/**
 * Create a checkpointer using a connection string
 */
export async function createKronosCheckpointerWithConnectionString(
  connectionString: string
): Promise<KronosCheckpointer> {
  return createKronosCheckpointer(connectionString);
}

/**
 * Create a checkpointer using environment variables
 */
export async function createKronosCheckpointerFromEnv(): Promise<KronosCheckpointer> {
  return createKronosCheckpointer();
}
