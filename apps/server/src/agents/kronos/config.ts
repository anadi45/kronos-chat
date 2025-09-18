/**
 * Configuration for Kronos Agent PostgreSQL Checkpointer
 */

export interface KronosCheckpointerConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
  maxConnections?: number;
}

/**
 * Get checkpointer configuration from environment variables
 */
export function getCheckpointerConfig(): KronosCheckpointerConfig {
  return {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'kronos_user',
    password: process.env.DATABASE_PASSWORD || 'kronos_password',
    database: process.env.DATABASE_NAME || 'kronos_chat',
    ssl: process.env.DATABASE_SSL === 'true',
    maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10'),
  };
}

/**
 * Build PostgreSQL connection string from configuration
 */
export function buildConnectionString(config: KronosCheckpointerConfig): string {
  const { host, port, username, password, database, ssl } = config;
  
  let connectionString = `postgresql://${username}:${password}@${host}:${port}/${database}`;
  
  if (ssl) {
    connectionString += '?sslmode=require';
  }
  
  return connectionString;
}

/**
 * Environment variables required for PostgreSQL checkpointer
 */
export const REQUIRED_ENV_VARS = [
  'DATABASE_HOST',
  'DATABASE_PORT', 
  'DATABASE_USERNAME',
  'DATABASE_PASSWORD',
  'DATABASE_NAME',
] as const;

/**
 * Validate that all required environment variables are set
 */
export function validateCheckpointerConfig(): void {
  const missing = REQUIRED_ENV_VARS.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.warn(`⚠️ Missing environment variables for PostgreSQL checkpointer: ${missing.join(', ')}`);
    console.warn('Using default values. For production, please set all required environment variables.');
  }
}
