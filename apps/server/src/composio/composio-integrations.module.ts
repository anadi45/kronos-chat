import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ComposioIntegrationsService } from './composio-integrations.service';
import { ComposioIntegrationsController } from './composio-integrations.controller';
import { ComposioIntegrationsRepository } from './composio-integrations.repository';
import { ComposioIntegration } from '../entities/composio-integration.entity';

/**
 * Professional module for Composio integrations
 * Provides OAuth connection management, tool integration, and third-party service connectivity
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ComposioIntegration]),
  ],
  controllers: [ComposioIntegrationsController],
  providers: [ComposioIntegrationsService, ComposioIntegrationsRepository],
  exports: [ComposioIntegrationsService, ComposioIntegrationsRepository],
})
export class ComposioIntegrationsModule {}
