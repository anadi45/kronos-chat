import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Composio } from '@composio/core';

/**
 * Generic Tool Executor Service
 * 
 * This service provides a generic interface to execute MCP tools through Composio.
 * It handles the Composio client initialization and tool execution with proper error handling.
 * This service is not tied to any specific AI provider and can work with any MCP-compatible tools.
 */
@Injectable()
export class McpToolExecutorService {
  private readonly logger = new Logger(McpToolExecutorService.name);
  private readonly composio: Composio;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('COMPOSIO_API_KEY');

    if (!apiKey) {
      throw new Error('COMPOSIO_API_KEY is required but not configured');
    }

    this.composio = new Composio({
      apiKey,
    });

    this.logger.log('Generic Tool Executor Service initialized successfully');
  }

  /**
   * Execute MCP tools through Composio
   * 
   * @param userId - User ID for the Composio session
   * @param tools - Array of tool names to get from Composio
   * @param parameters - Parameters to pass to the tools
   * @returns Promise<any> - The execution result
   */
  async executeTools(
    userId: string,
    tools: string[],
    parameters?: any
  ): Promise<any> {
    try {
      this.logger.debug(`Executing MCP tools for user ${userId}: ${tools.join(', ')}`);

      // Get tools for this user
      const composioTools = await this.composio.tools.get(userId, {
        tools,
      });

      this.logger.debug(`Retrieved ${composioTools.length} tools from Composio`);

      // Execute tools directly with parameters
      const results = [];
      for (const tool of composioTools) {
        try {
          const result = await tool.function.invoke(parameters || {});
          results.push({
            toolName: tool.function.name,
            result,
            success: true
          });
        } catch (toolError) {
          this.logger.error(`Tool ${tool.function.name} execution failed:`, toolError);
          results.push({
            toolName: tool.function.name,
            result: null,
            success: false,
            error: toolError.message
          });
        }
      }
      
      this.logger.debug('MCP tool execution completed');
      return results;
    } catch (error) {
      this.logger.error('MCP tool execution failed:', error);
      throw error;
    }
  }

  /**
   * Execute a specific MCP tool with parameters
   * 
   * @param userId - User ID for the Composio session
   * @param toolName - Name of the tool to execute
   * @param parameters - Parameters for the tool
   * @returns Promise<any> - The execution result
   */
  async executeSpecificTool(
    userId: string,
    toolName: string,
    parameters: any
  ): Promise<any> {
    try {
      this.logger.debug(`Executing specific MCP tool: ${toolName} for user ${userId}`);

      // Get the specific tool
      const tools = await this.composio.tools.get(userId, {
        tools: [toolName],
      });

      if (tools.length === 0) {
        throw new Error(`Tool ${toolName} not found`);
      }

      const tool = tools[0];

      // Execute the tool directly
      const result = await tool.function.invoke(parameters);
      
      this.logger.debug(`Tool ${toolName} executed successfully`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to execute tool ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * Get available MCP tools for a user
   * 
   * @param userId - User ID
   * @param toolkits - Optional array of toolkit names to filter by
   * @returns Promise<any[]> - Array of available tools
   */
  async getAvailableTools(userId: string, toolkits?: string[]): Promise<any[]> {
    try {
      this.logger.debug(`Getting available MCP tools for user ${userId}`);

      const tools = await this.composio.tools.get(userId, {
        toolkits: toolkits || ['GMAIL', 'GOOGLECALENDAR', 'SLACK', 'NOTION'],
      });

      this.logger.debug(`Found ${tools.length} available MCP tools`);
      return tools;
    } catch (error) {
      this.logger.error('Failed to get available MCP tools:', error);
      throw error;
    }
  }

  /**
   * Check if a user has access to specific tools
   * 
   * @param userId - User ID
   * @param toolNames - Array of tool names to check
   * @returns Promise<boolean[]> - Array of boolean values indicating tool availability
   */
  async checkToolAvailability(userId: string, toolNames: string[]): Promise<boolean[]> {
    try {
      const availableTools = await this.getAvailableTools(userId);
      const availableToolNames = availableTools.map(tool => tool.function?.name).filter(Boolean);
      
      return toolNames.map(toolName => availableToolNames.includes(toolName));
    } catch (error) {
      this.logger.error('Failed to check tool availability:', error);
      return toolNames.map(() => false);
    }
  }

  /**
   * Get tool information
   * 
   * @param userId - User ID
   * @param toolName - Name of the tool
   * @returns Promise<any> - Tool information
   */
  async getToolInfo(userId: string, toolName: string): Promise<any> {
    try {
      const tools = await this.getAvailableTools(userId);
      const tool = tools.find(t => t.function?.name === toolName);
      
      if (!tool) {
        throw new Error(`Tool ${toolName} not found`);
      }
      
      return {
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters,
        toolkit: tool.toolkit,
      };
    } catch (error) {
      this.logger.error(`Failed to get tool info for ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * Execute calendar tools (example)
   * 
   * @param userId - User ID
   * @param days - Number of days to look ahead
   * @returns Promise<any> - Calendar events
   */
  async getCalendarEvents(userId: string, days: number = 7): Promise<any> {
    try {
      const today = new Date();
      const parameters = {
        timeMin: today.toISOString(),
        timeMax: new Date(today.getTime() + days * 24 * 60 * 60 * 1000).toISOString(),
        maxResults: 10
      };
      
      return await this.executeSpecificTool(userId, 'GOOGLECALENDAR_EVENTS_LIST', parameters);
    } catch (error) {
      this.logger.error('Failed to get calendar events:', error);
      throw error;
    }
  }

  /**
   * Execute email tools (example)
   * 
   * @param userId - User ID
   * @param query - Email search query
   * @returns Promise<any> - Email results
   */
  async searchEmails(userId: string, query: string): Promise<any> {
    try {
      const parameters = {
        q: query,
        maxResults: 10
      };
      
      return await this.executeSpecificTool(userId, 'GMAIL_MESSAGES_LIST', parameters);
    } catch (error) {
      this.logger.error('Failed to search emails:', error);
      throw error;
    }
  }
}
