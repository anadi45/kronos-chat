import { Module } from '@nestjs/common';
import { ComposioService } from './composio.service';
import { ComposioController } from './composio.controller';

@Module({
  controllers: [ComposioController],
  providers: [ComposioService],
  exports: [ComposioService],
})
export class ComposioModule {}
