import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolsProviderService } from './tools-provider.service';
import { ToolsExecutorService } from './tools-executor.service';
import { McpToolExecutorService } from './mcp-tool-executor.service';
import { ComposioOAuth } from '../entities/composio-oauth.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ComposioOAuth])],
  providers: [ToolsProviderService, ToolsExecutorService, McpToolExecutorService],
  exports: [ToolsProviderService, ToolsExecutorService, McpToolExecutorService],
})
export class ToolsModule {}
