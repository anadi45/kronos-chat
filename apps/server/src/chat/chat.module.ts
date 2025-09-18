import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Conversation } from '../entities/conversation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation])],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
