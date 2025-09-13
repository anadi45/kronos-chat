import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ComposioIntegrationsService } from './composio-integrations.service';

@Module({
  imports: [ConfigModule],
  providers: [ComposioIntegrationsService],
  exports: [ComposioIntegrationsService],
})
export class ComposioIntegrationsModule {}
