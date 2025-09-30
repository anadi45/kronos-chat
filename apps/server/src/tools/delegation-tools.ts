import { DynamicStructuredTool } from '@langchain/core/tools';
import { Provider } from '@quark/core';
import { SubagentFactory } from '../subagents';
import { CheckpointerService } from '../checkpointer';
import { ToolsExecutorService } from './tools-executor.service';
import { ToolsProviderService } from './tools-provider.service';
import { Logger } from '@nestjs/common';
import { HumanMessage } from '@langchain/core/messages';

/**
 * Interface for delegation tool configuration
 */
interface DelegationToolConfig {
  checkpointerService: CheckpointerService;
  toolsExecutorService: ToolsExecutorService;
  toolsProviderService: ToolsProviderService;
}

/**
 * Create delegation tools for each provider
 */
export class DelegationToolsFactory {
  private readonly logger = new Logger(DelegationToolsFactory.name);
  private subagentFactory: SubagentFactory;

  constructor(config: DelegationToolConfig) {
    this.subagentFactory = new SubagentFactory(
      config.checkpointerService,
      config.toolsExecutorService,
      config.toolsProviderService
    );
  }

  /**
   * Create delegation tool for a specific provider
   */
  createDelegationTool(provider: Provider): DynamicStructuredTool {
    const toolName = `delegateTo${this.capitalizeProvider(provider)}Agent`;

    return new DynamicStructuredTool({
      name: toolName,
      description: `Delegate tasks to the ${provider} subagent for specialized handling of ${provider}-related operations. Use this when the user's request involves ${provider} functionality. 

IMPORTANT EXECUTION GUIDELINES:
- For INDEPENDENT tasks (no data flow between them), call multiple delegation tools in a single API call (PARALLEL execution)
- For DEPENDENT tasks (one task's output feeds into another), call delegation tools in separate API calls (SEQUENTIAL execution)
- Use the 'context' parameter to pass results from previous tasks when doing SEQUENTIAL execution`,
      schema: {
        type: 'object',
        properties: {
          userQuery: {
            type: 'string',
            description:
              "The user's query or request that needs to be handled by the subagent",
          },
          context: {
            type: 'string',
            description:
              'Additional context or information that might be relevant for the subagent. For SEQUENTIAL execution, use this to pass results from previous tasks (e.g., Reddit data for email content)',
            default: '',
          },
        },
        required: ['userQuery'],
      },
      func: async ({
        userQuery,
        context = '',
        userId,
      }: {
        userQuery: string;
        context?: string;
        userId?: string;
      }): Promise<string> => {
        try {
          this.logger.debug(`Delegating to ${provider} subagent: ${userQuery}`);

          // Create subagent instance with actual userId
          const subagent = this.subagentFactory.createSubagent(
            provider,
            userId
          );

          // Build the subagent
          const compiledSubagent = await subagent.build();

          // Prepare the state for the subagent
          const initialState = {
            messages: [
              new HumanMessage(
                context
                  ? `${userQuery}\n\nContext: ${context}`
                  : userQuery
              ),
            ],
          };

          // Execute the subagent with delegation context and proper thread ID
          const result = await compiledSubagent.invoke(initialState, {
            configurable: {
              delegationContext: true,
              userId: userId,
              thread_id: `delegation_${provider}_${Date.now()}`,
            },
          });

          this.logger.debug(`${provider} subagent completed successfully`);

          return JSON.stringify({
            success: true,
            provider: provider,
            result:
              result.result ||
              result.messages?.[result.messages.length - 1]?.content,
          });
        } catch (error) {
          this.logger.error(
            `Failed to delegate to ${provider} subagent:`,
            error
          );

          return JSON.stringify({
            success: false,
            provider: provider,
            error: error.message,
          });
        }
      },
    });
  }

  /**
   * Create all delegation tools for available providers
   */
  createAllDelegationTools(
    availableProviders: Provider[]
  ): DynamicStructuredTool[] {
    return availableProviders.map((provider) =>
      this.createDelegationTool(provider)
    );
  }

  /**
   * Capitalize provider name for tool naming
   */
  private capitalizeProvider(provider: Provider): string {
    return provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase();
  }
}
