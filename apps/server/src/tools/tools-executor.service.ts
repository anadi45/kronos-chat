import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@langchain/core/tools';
import { ToolMessage } from '@langchain/core/messages';
import { ToolsProviderService } from './tools-provider.service';
import { McpToolExecutorService } from './mcp-tool-executor.service';

/**
 * Interface for tool execution result
 */
export interface ToolExecutionResult {
  success: boolean;
  result: any;
  error?: string;
  toolName: string;
  executionTime: number;
}

/**
 * Interface for tool call information
 */
export interface ToolCallInfo {
  name: string;
  args: any;
  id: string;
  type: 'inhouse' | 'mcp';
}

/**
 * Tools Executor Service
 * 
 * This service handles execution of both in-house tools and MCP tools.
 * It provides a unified interface for tool execution with proper error handling,
 * logging, and result formatting.
 */
@Injectable()
export class ToolsExecutorService {
  private readonly logger = new Logger(ToolsExecutorService.name);
  private readonly toolsProviderService: ToolsProviderService;
  private readonly mcpToolExecutor: McpToolExecutorService;

  constructor(
    toolsProviderService: ToolsProviderService,
    mcpToolExecutor: McpToolExecutorService
  ) {
    this.toolsProviderService = toolsProviderService;
    this.mcpToolExecutor = mcpToolExecutor;
  }

  /**
   * Execute a single tool call
   * 
   * @param toolCall - The tool call information
   * @param userId - User ID for context
   * @returns Promise<ToolExecutionResult> - Execution result
   */
  async executeTool(toolCall: ToolCallInfo, userId: string): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    
    try {
      this.logger.debug(`Executing tool: ${toolCall.name} for user: ${userId}`);
      
      // Determine tool type and execute accordingly
      const toolType = this.determineToolType(toolCall.name);
      let result: any;

      if (toolType === 'inhouse') {
        result = await this.executeInhouseTool(toolCall, userId);
      } else {
        result = await this.executeMcpTool(toolCall, userId);
      }

      const executionTime = Date.now() - startTime;
      
      this.logger.debug(`Tool ${toolCall.name} executed successfully in ${executionTime}ms`);
      
      return {
        success: true,
        result,
        toolName: toolCall.name,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.logger.error(`Tool ${toolCall.name} execution failed:`, error);
      
      return {
        success: false,
        result: null,
        error: error.message,
        toolName: toolCall.name,
        executionTime,
      };
    }
  }

  /**
   * Execute multiple tool calls in parallel
   * 
   * @param toolCalls - Array of tool calls to execute
   * @param userId - User ID for context
   * @returns Promise<ToolExecutionResult[]> - Array of execution results
   */
  async executeTools(toolCalls: ToolCallInfo[], userId: string): Promise<ToolExecutionResult[]> {
    this.logger.debug(`Executing ${toolCalls.length} tools for user: ${userId}`);
    
    const executionPromises = toolCalls.map(toolCall => 
      this.executeTool(toolCall, userId)
    );
    
    const results = await Promise.all(executionPromises);
    
    const successCount = results.filter(r => r.success).length;
    this.logger.debug(`Executed ${toolCalls.length} tools: ${successCount} successful, ${toolCalls.length - successCount} failed`);
    
    return results;
  }

  /**
   * Execute tools and return ToolMessage array for LangChain
   * 
   * @param toolCalls - Array of tool calls to execute
   * @param userId - User ID for context
   * @returns Promise<ToolMessage[]> - Array of ToolMessage objects
   */
  async executeToolsAndReturnMessages(toolCalls: ToolCallInfo[], userId: string): Promise<ToolMessage[]> {
    const results = await this.executeTools(toolCalls, userId);
    
    return results.map(result => {
      const content = result.success 
        ? JSON.stringify(result.result)
        : `Error executing ${result.toolName}: ${result.error}`;
        
      return new ToolMessage({
        name: result.toolName,
        content,
        tool_call_id: toolCalls.find(tc => tc.name === result.toolName)?.id || '',
      });
    });
  }

  /**
   * Determine if a tool is in-house or MCP
   * 
   * @param toolName - Name of the tool
   * @returns 'inhouse' | 'mcp' - Tool type
   */
  private determineToolType(toolName: string): 'inhouse' | 'mcp' {
    if (this.toolsProviderService.isInhouseTool(toolName)) {
      return 'inhouse';
    }
    return 'mcp';
  }

  /**
   * Execute an in-house tool
   * 
   * @param toolCall - Tool call information
   * @param userId - User ID for context
   * @returns Promise<any> - Tool execution result
   */
  private async executeInhouseTool(toolCall: ToolCallInfo, userId: string): Promise<any> {
    const inhouseTools = this.toolsProviderService.getInhouseTools();
    const tool = inhouseTools.find(t => t.name === toolCall.name);
    
    if (!tool) {
      throw new Error(`In-house tool ${toolCall.name} not found`);
    }

    // Add user context to tool arguments
    const toolArgs = {
      ...toolCall.args,
      userId,
    };

    return await tool.invoke(toolArgs);
  }

  /**
   * Execute an MCP tool
   * 
   * @param toolCall - Tool call information
   * @param userId - User ID for context
   * @returns Promise<any> - Tool execution result
   */
  private async executeMcpTool(toolCall: ToolCallInfo, userId: string): Promise<any> {
    try {
      // Use the MCP tool executor service for direct execution
      const result = await this.mcpToolExecutor.executeSpecificTool(
        userId,
        toolCall.name,
        toolCall.args
      );
      
      return result;
    } catch (error) {
      this.logger.error(`MCP tool execution failed for ${toolCall.name}:`, error);
      throw error;
    }
  }

  /**
   * Get all available tools for a user (both in-house and MCP)
   * 
   * @param userId - User ID
   * @returns Promise<Tool[]> - Array of available tools
   */
  async getAvailableTools(userId: string): Promise<Tool[]> {
    try {
      // Use the tools provider service to get all tools
      const allTools = await this.toolsProviderService.getAvailableTools(userId);
      
      this.logger.debug(`Retrieved ${allTools.length} tools for user ${userId}`);
      
      return allTools;
    } catch (error) {
      this.logger.error(`Failed to get available tools for user ${userId}:`, error);
      // Return only in-house tools if MCP fails
      return this.toolsProviderService.getInhouseTools();
    }
  }

  /**
   * Check if a tool is available for a user
   * 
   * @param toolName - Name of the tool
   * @param userId - User ID
   * @returns Promise<boolean> - Whether the tool is available
   */
  async isToolAvailable(toolName: string, userId: string): Promise<boolean> {
    try {
      const tools = await this.getAvailableTools(userId);
      return tools.some(tool => tool.name === toolName);
    } catch (error) {
      this.logger.error(`Failed to check tool availability for ${toolName}:`, error);
      return false;
    }
  }

  /**
   * Get tool information
   * 
   * @param toolName - Name of the tool
   * @param userId - User ID
   * @returns Promise<any> - Tool information
   */
  async getToolInfo(toolName: string, userId: string): Promise<any> {
    try {
      const tools = await this.getAvailableTools(userId);
      const tool = tools.find(t => t.name === toolName);
      
      if (!tool) {
        throw new Error(`Tool ${toolName} not found`);
      }
      
      return {
        name: tool.name,
        description: tool.description,
        type: this.determineToolType(toolName),
        schema: tool.schema,
      };
    } catch (error) {
      this.logger.error(`Failed to get tool info for ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * Register a new in-house tool
   * 
   * @param tool - Tool to register
   */
  registerInhouseTool(tool: Tool): void {
    this.toolsProviderService.registerInhouseTool(tool);
  }

  /**
   * Unregister an in-house tool
   * 
   * @param toolName - Name of the tool to unregister
   */
  unregisterInhouseTool(toolName: string): void {
    this.toolsProviderService.unregisterInhouseTool(toolName);
  }

  /**
   * Get execution statistics
   * 
   * @returns Object with execution statistics
   */
  getExecutionStats(): any {
    return this.toolsProviderService.getExecutionStats();
  }
}
