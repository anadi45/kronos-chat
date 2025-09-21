import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OAuthIntegrationsController } from './oauth-integrations.controller';
import { OAuthIntegrationsService } from './oauth-integrations.service';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [OAuthIntegrationsController],
  providers: [OAuthIntegrationsService],
  exports: [OAuthIntegrationsService],
})
export class OAuthIntegrationsModule {}
