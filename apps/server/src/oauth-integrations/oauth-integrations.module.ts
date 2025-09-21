import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OAuthIntegrationsController } from './oauth-integrations.controller';
import { OAuthIntegrationsService } from './oauth-integrations.service';
import { User } from '../entities/user.entity';
import { ComposioOAuth } from '../entities/composio-oauth.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, ComposioOAuth])],
  controllers: [OAuthIntegrationsController],
  providers: [OAuthIntegrationsService],
  exports: [OAuthIntegrationsService],
})
export class OAuthIntegrationsModule {}
