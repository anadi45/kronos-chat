import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';

export const getDatabaseConfig = (
  configService: ConfigService
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST', 'localhost'),
  port: configService.get<number>('DATABASE_PORT', 5432),
  username: configService.get<string>('DATABASE_USERNAME', 'kronos_user'),
  password: configService.get<string>('DATABASE_PASSWORD', 'kronos_password'),
  database: configService.get<string>('DATABASE_NAME', 'kronos_chat'),
  entities: [User],
  synchronize:
    configService.get<string>('NODE_ENV', 'development') === 'development',
  logging: configService.get<boolean>('DATABASE_LOGGING', false),
  ssl:
    configService.get<string>('NODE_ENV') === 'production'
      ? { rejectUnauthorized: false }
      : false,
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'migrations',
});
