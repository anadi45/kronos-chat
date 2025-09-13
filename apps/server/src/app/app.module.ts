import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '../config/config.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { ComposioIntegrationsModule } from '../composio/composio-integrations.module';

@Module({
  imports: [ConfigModule, UsersModule, AuthModule, ChatModule, ComposioIntegrationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
