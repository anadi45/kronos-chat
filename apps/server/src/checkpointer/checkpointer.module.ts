import { Global, Module } from '@nestjs/common';
import { CheckpointerService } from './checkpointer.service';

/**
 * Global module for PostgreSQL checkpointer functionality
 * Makes CheckpointerService available throughout the application
 */
@Global()
@Module({
  providers: [CheckpointerService],
  exports: [CheckpointerService],
})
export class CheckpointerModule {}
