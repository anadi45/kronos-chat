import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';

@Module({
  controllers: [ChatController],
  providers: [],
})
export class ChatModule {}
