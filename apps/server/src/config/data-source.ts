import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file - look in workspace root
config({ path: path.resolve(__dirname, '../../../../.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'quark_user',
  password: process.env.DATABASE_PASSWORD || 'quark_password',
  database: process.env.DATABASE_NAME || 'quark_chat',
  synchronize: false, // Never use synchronize in production
  logging: process.env.DATABASE_LOGGING === 'true' || false,
  ssl: { rejectUnauthorized: false },
  //   entities: ['src/entities/*.ts'],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
  migrationsRun: false, // Don't auto-run migrations,
});
