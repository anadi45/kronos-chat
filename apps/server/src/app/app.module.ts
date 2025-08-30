import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '../config/config.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { ComposioModule } from '../composio/composio.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ConfigModule, UsersModule, AuthModule, ComposioModule, ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
