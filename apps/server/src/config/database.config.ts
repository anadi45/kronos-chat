import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { Conversation } from '../entities/conversation.entity';
import { ComposioOAuth } from '../entities/composio-oauth.entity';

export const getDatabaseConfig = (
  configService: ConfigService
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST', 'localhost'),
  port: configService.get<number>('DATABASE_PORT', 5432),
  username: configService.get<string>('DATABASE_USERNAME', 'quark_user'),
  password: configService.get<string>('DATABASE_PASSWORD', 'quark_password'),
  database: configService.get<string>('DATABASE_NAME', 'quark_chat'),
  entities: [User, Conversation, ComposioOAuth],
  synchronize: false, // Always use migrations instead of sync
  logging: configService.get<boolean>('DATABASE_LOGGING', false),
  ssl: { rejectUnauthorized: false },
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'migrations',
  migrationsRun: false, // Don't auto-run migrations
});
