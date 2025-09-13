import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ComposioIntegrationsService } from './composio-integrations.service';
import { ComposioIntegrationsRepository } from './composio-integrations.repository';
import { ComposioIntegration } from '../entities/composio-integration.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ComposioIntegration]),
  ],
  providers: [ComposioIntegrationsService, ComposioIntegrationsRepository],
  exports: [ComposioIntegrationsService, ComposioIntegrationsRepository],
})
export class ComposioIntegrationsModule {}
