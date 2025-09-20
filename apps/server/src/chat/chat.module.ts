import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Conversation } from '../entities/conversation.entity';
import { OAuthIntegrationsModule } from '../oauth-integrations/oauth-integrations.module';
import { ToolsModule } from '../tools/tools.module';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation]), OAuthIntegrationsModule, ToolsModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
