import { Module } from '@nestjs/common';
import { OAuthIntegrationsController } from './oauth-integrations.controller';
import { OAuthIntegrationsService } from './oauth-integrations.service';

@Module({
  controllers: [OAuthIntegrationsController],
  providers: [OAuthIntegrationsService],
  exports: [OAuthIntegrationsService],
})
export class OAuthIntegrationsModule {}
