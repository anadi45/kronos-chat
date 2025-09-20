import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Composio } from '@composio/core';
import { Tool } from '@langchain/core/tools';
import { internalLogger } from '../utils/logger';
import { LangChainToolConverter } from '../agents/utils/langchain-tool-converter';

/**
 * Signal Context Readiness Tool
 *
 * This tool should be called only after the agent has gathered all necessary information
 * to fully answer the user's query.
 */
class SignalContextReadinessTool extends Tool {
  name = 'signalContextReadiness';
  description =
    "Call this tool only after you have gathered all the necessary information to fully answer the user's query";

  async _call(): Promise<string> {
    console.log(`${this.name} tool was called`);
    return 'Context readiness signaled - agent has gathered all necessary information';
  }
}

/**
 * Tools Provider Service
 * 
 * This service handles tool retrieval and conversion from Composio and manages in-house tools.
 * It serves as the provider for all tools in the tools module.
 */
@Injectable()
export class ToolsProviderService {
  private readonly logger = new Logger(ToolsProviderService.name);
  private readonly composio: Composio;
  private readonly inhouseTools: Map<string, Tool> = new Map();

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('COMPOSIO_API_KEY');

    if (!apiKey) {
      throw new Error(
        'COMPOSIO_API_KEY is required but not configured. Please set the COMPOSIO_API_KEY environment variable.'
      );
    }

    this.composio = new Composio({ apiKey });
    this.initializeInhouseTools();
    this.logger.log('Tools provider service initialized successfully');
  }

  /**
   * Initialize in-house tools
   */
  private initializeInhouseTools(): void {
    // Register in-house tools
    const signalContextReadinessTool = new SignalContextReadinessTool();
    this.inhouseTools.set(signalContextReadinessTool.name, signalContextReadinessTool);
    
    this.logger.log(`Initialized ${this.inhouseTools.size} in-house tools`);
  }

  /**
   * Retrieves available tools for a user (both MCP tools and in-house tools)
   *
   * @param userId - The user identifier
   * @param toolkits - Array of toolkit names to retrieve tools for
   * @returns Promise<any[]> - Array of LangChain compatible tools
   */
  async getAvailableTools(
    userId: string,
    toolkits: string[] = ['GMAIL']
  ): Promise<any[]> {
    try {
      this.logger.log(
        `Retrieving tools for user ${userId} with toolkits: ${toolkits.join(
          ', '
        )}`
      );

      // Get MCP tools from Composio
      const composioTools = await this.composio.tools.get(userId, {
        toolkits,
      });

      internalLogger.info(`MCP tools retrieved successfully`, { tools: composioTools });

      // Convert Composio tools to LangChain compatible tools
      const mcpLangchainTools = composioTools.map((tool: any) => {
        try {
          // Use type assertion to completely bypass strict typing
          const convertedTool = (LangChainToolConverter as any).convert(tool);
          return convertedTool;
        } catch (conversionError) {
          this.logger.warn(
            `Failed to convert tool ${tool?.function?.name || 'unknown'}:`,
            conversionError.message
          );
          return null;
        }
      }).filter(Boolean); // Remove null values

      // Get in-house tools
      const inhouseTools = Array.from(this.inhouseTools.values());

      // Combine all tools
      const allTools = [...mcpLangchainTools, ...inhouseTools];

      this.logger.log(`Successfully retrieved ${allTools.length} tools (${mcpLangchainTools.length} MCP, ${inhouseTools.length} in-house)`);
      return allTools;
    } catch (error) {
      this.logger.error(`Failed to retrieve tools:`, error);
      // Return only in-house tools if MCP fails
      const inhouseTools = Array.from(this.inhouseTools.values());
      this.logger.warn(`Falling back to in-house tools only: ${inhouseTools.length} tools`);
      return inhouseTools;
    }
  }

  /**
   * Get in-house tools only
   *
   * @returns Tool[] - Array of in-house tools
   */
  getInhouseTools(): Tool[] {
    return Array.from(this.inhouseTools.values());
  }

  /**
   * Register a new in-house tool
   *
   * @param tool - Tool to register
   */
  registerInhouseTool(tool: Tool): void {
    this.inhouseTools.set(tool.name, tool);
    this.logger.log(`Registered in-house tool: ${tool.name}`);
  }

  /**
   * Unregister an in-house tool
   *
   * @param toolName - Name of the tool to unregister
   */
  unregisterInhouseTool(toolName: string): void {
    if (this.inhouseTools.delete(toolName)) {
      this.logger.log(`Unregistered in-house tool: ${toolName}`);
    } else {
      this.logger.warn(`In-house tool ${toolName} was not registered`);
    }
  }

  /**
   * Check if a tool is in-house
   *
   * @param toolName - Name of the tool
   * @returns boolean - Whether the tool is in-house
   */
  isInhouseTool(toolName: string): boolean {
    return this.inhouseTools.has(toolName);
  }

  /**
   * Get tool information
   *
   * @param toolName - Name of the tool
   * @returns any - Tool information or null if not found
   */
  getToolInfo(toolName: string): any {
    const tool = this.inhouseTools.get(toolName);
    if (!tool) {
      return null;
    }
    
    return {
      name: tool.name,
      description: tool.description,
      type: 'inhouse',
      schema: tool.schema,
    };
  }

  /**
   * Get execution statistics
   *
   * @returns Object with execution statistics
   */
  getExecutionStats(): any {
    return {
      inhouseToolsCount: this.inhouseTools.size,
      inhouseTools: Array.from(this.inhouseTools.keys()),
    };
  }

  /**
   * Checks if the service is properly configured
   * Since we throw an error during initialization if not configured,
   * this will always return true if the service instance exists
   *
   * @returns boolean - Configuration status
   */
  isServiceConfigured(): boolean {
    return true;
  }
}
