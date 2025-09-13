import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { ComposioIntegrationsModule } from '../composio/composio-integrations.module';

/**
 * Module for managing general integrations
 * Provides a unified interface for all integration types
 */
@Module({
  imports: [ComposioIntegrationsModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
