import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '../config/config.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { OAuthIntegrationsModule } from '../oauth-integrations/oauth-integrations.module';
import { CheckpointerModule } from '../checkpointer';

@Module({
  imports: [ConfigModule, CheckpointerModule, UsersModule, AuthModule, ChatModule, OAuthIntegrationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
