import { Module } from '@nestjs/common';
import { ToolsProviderService } from './tools-provider.service';
import { ToolsExecutorService } from './tools-executor.service';
import { McpToolExecutorService } from './mcp-tool-executor.service';

@Module({
  providers: [ToolsProviderService, ToolsExecutorService, McpToolExecutorService],
  exports: [ToolsProviderService, ToolsExecutorService, McpToolExecutorService],
})
export class ToolsModule {}
