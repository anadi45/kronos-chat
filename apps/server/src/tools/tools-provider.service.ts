import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Composio } from '@composio/core';
import { Tool, DynamicStructuredTool } from '@langchain/core/tools';
import { LangChainToolConverter } from './langchain-tool-converter';
import { ComposioOAuth } from '../entities/composio-oauth.entity';
import { getToolsForToolkits } from './toolkit-mappings';

/**
 * Signal Context Readiness Tool
 *
 * This tool should be called only after the agent has gathered all necessary information
 * to fully answer the user's query.
 */
export function createSignalContextReadinessTool() {
  return new DynamicStructuredTool({
    name: "signalContextReadiness",
    description: "Call this tool only after you have gathered all the necessary information to fully answer the user's query",
    schema: {
      type: "object",
      properties: {
        called: {
          type: "boolean",
          description: "Indicates whether the context readiness has been called"
        }
      },
      required: ["called"]
    },
    func: async ({ called }: { called: boolean }): Promise<string> => {
      console.log(`signalContextReadiness tool was called with:`, { called });
      
      if (called) {
        return 'Context readiness signaled - agent has gathered all necessary information';
      } else {
        return 'Context readiness not yet signaled';
      }
    }
  });
}

export const SignalContextReadinessTool = createSignalContextReadinessTool();

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
  private readonly inhouseTools: Map<string, any> = new Map();

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(ComposioOAuth)
    private readonly composioOAuthRepository: Repository<ComposioOAuth>
  ) {
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
    this.inhouseTools.set(
      SignalContextReadinessTool.name,
      SignalContextReadinessTool
    );

    this.logger.log(`Initialized ${this.inhouseTools.size} in-house tools`);
  }

  /**
   * Get toolkit mappings for debugging
   * 
   * @param toolkits - Array of toolkit names
   * @returns Object with toolkit mappings
   */
  getToolkitMappings(toolkits: string[]): { [key: string]: string[] } {
    const mappings: { [key: string]: string[] } = {};
    
    for (const toolkit of toolkits) {
      mappings[toolkit] = getToolsForToolkits([toolkit]);
    }
    
    return mappings;
  }

  /**
   * Get user OAuth integrations from database
   *
   * @param userId - The user identifier
   * @returns Promise<string[]> - Array of platform names (toolkits)
   */
  private async getUserOAuthIntegrations(userId: string): Promise<string[]> {
    try {
      const integrations = await this.composioOAuthRepository.find({
        where: { userId },
        select: ['platform'],
      });

      const platforms = integrations.map(integration => integration.platform);
      this.logger.log(
        `Found ${platforms.length} OAuth integrations for user ${userId}: ${platforms.join(', ')}`
      );
      return platforms;
    } catch (error) {
      this.logger.error(
        `Failed to get OAuth integrations for user ${userId}:`,
        error
      );
      return [];
    }
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
    toolkits: string[] = []
  ): Promise<any[]> {
    try {
      // If no toolkits provided, fetch user's OAuth integrations from database
      let finalToolkits = toolkits;
      if (toolkits.length === 0) {
        finalToolkits = await this.getUserOAuthIntegrations(userId);
        this.logger.log(
          `No toolkits provided, using user's OAuth integrations: ${finalToolkits.join(', ')}`
        );
      }

      this.logger.log(
        `Retrieving tools for user ${userId} with toolkits: ${finalToolkits.join(
          ', '
        )}`
      );

      // Get specific tool names from our mappings instead of passing toolkits
      const allowedToolNames = getToolsForToolkits(finalToolkits);
      this.logger.log(`Extracted tool names from mappings: ${allowedToolNames.join(', ')}`);

      // Get MCP tools from Composio using specific tool names
      const composioTools = await this.composio.tools.get(userId, {
        tools: allowedToolNames, // Pass specific tool names instead of toolkits
      });

      // Convert Composio tools to LangChain compatible tools
      const mcpLangchainTools = composioTools
        .map((tool: any) => {
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
        })
        .filter(Boolean); // Remove null values

      // Get in-house tools
      const inhouseTools = Array.from(this.inhouseTools.values());

      // Combine all tools
      const allTools = [...mcpLangchainTools, ...inhouseTools];

      this.logger.log(
        `Successfully retrieved ${allTools.length} tools (${mcpLangchainTools.length} MCP, ${inhouseTools.length} in-house)`
      );
      return allTools;
    } catch (error) {
      this.logger.error(`Failed to retrieve tools:`, error);
      // Return only in-house tools if MCP fails
      const inhouseTools = Array.from(this.inhouseTools.values());
      this.logger.warn(
        `Falling back to in-house tools only: ${inhouseTools.length} tools`
      );
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
