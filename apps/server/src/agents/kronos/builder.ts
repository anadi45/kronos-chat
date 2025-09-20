import { StateGraph, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  SystemMessage,
  AIMessage,
  ToolMessage,
  isAIMessage,
} from '@langchain/core/messages';
import { RunnableConfig } from '@langchain/core/runnables';
import { Logger } from '@nestjs/common';
import { KronosAgentState, KronosAgentStateSchema } from './state';
import { MODELS } from '../../constants/models.constants';
import { formatSystemPrompt } from './prompts';
import { getContextValue, extractToolCalls } from './utils';
import { getCurrentDate } from '@kronos/core';
import { CheckpointerService } from '../../checkpointer';
import { OAuthIntegrationsService } from '../../oauth-integrations/oauth-integrations.service';
import { ToolsExecutorService } from '../../tools/tools-executor.service';
import { ToolsProviderService } from '../../tools/tools-provider.service';

/**
 * Kronos Agent Builder
 *
 * Encapsulates the complex logic for building the Kronos agent graph using LangGraph.
 * This builder creates a workflow with tool execution, agent reasoning, and response generation.
 */
export class KronosAgentBuilder {
  private model: ChatGoogleGenerativeAI;
  private tools: any[] = [];
  private checkpointerService: CheckpointerService;
  private oauthIntegrationsService: OAuthIntegrationsService;
  private toolsExecutorService: ToolsExecutorService;
  private toolsProviderService: ToolsProviderService;
  private userId: string;
  private readonly logger = new Logger(KronosAgentBuilder.name);

  AGENT_NAME = 'kronos_agent';

  constructor(
    userId: string,
    checkpointerService: CheckpointerService,
    oauthIntegrationsService: OAuthIntegrationsService,
    toolsExecutorService: ToolsExecutorService,
    toolsProviderService: ToolsProviderService
  ) {
    this.userId = userId;
    this.checkpointerService = checkpointerService;
    this.oauthIntegrationsService = oauthIntegrationsService;
    this.toolsExecutorService = toolsExecutorService;
    this.toolsProviderService = toolsProviderService;
    this.initializeProviders();
  }

  /**
   * Build and return the complete Kronos agent graph
   */
  async build(): Promise<ReturnType<StateGraph<any>['compile']>> {
    try {
      await this.loadTools(this.userId);

      const workflow = new StateGraph(KronosAgentStateSchema);

      await this.addNodes(workflow);
      this.configureEdges(workflow);

      const compileOptions: any = {
        name: this.AGENT_NAME,
        checkpointer: this.checkpointerService.getCheckpointer(),
      };

      const compiledGraph = workflow.compile(compileOptions);
      return compiledGraph;
    } catch (error) {
      throw new Error(`Failed to build Kronos agent: ${error.message}`);
    }
  }

  /**
   * Initialize Providers
   */
  private initializeProviders(): void {
    try {
      this.model = new ChatGoogleGenerativeAI({
        model: MODELS.GEMINI_2_0_FLASH,
        temperature: 0.7,
        maxOutputTokens: 2048,
        apiKey: process.env.GEMINI_API_KEY,
        streaming: true,
      });
    } catch (error) {
      throw new Error(`Failed to initialize Providers: ${error.message}`);
    }
  }

  /**
   * Load all available tools for a given user
   */
  private async loadTools(userId: string): Promise<void> {
    try {
      // Use the tools provider service to get all available tools
      const tools = await this.toolsProviderService.getAvailableTools(userId);

      this.tools = tools;

      this.logger.log(`Loaded ${this.tools.length} tools using ToolsProviderService`);
    } catch (error) {
      this.logger.warn(
        'Failed to load tools, continuing without tools',
        error.message
      );
      this.tools = [];
    }
  }

  /**
   * Add all nodes to the workflow graph
   */
  private async addNodes(workflow: any): Promise<void> {
    workflow.addNode('agent', this.createAgentNode());
    workflow.addNode('tool', this.createToolNode());
    workflow.addNode('final_answer', this.createFinalAnswerNode());
  }

  /**
   * Configure the workflow execution flow
   */
  private configureEdges(workflow: any): void {
    // Set entry point
    workflow.setEntryPoint('agent');

    // Agent -> tools or final answer node
    workflow.addConditionalEdges('agent', this.shouldAct, {
      continue: 'tool',
      final_answer: 'final_answer',
    });

    // Tool -> agent (loop back)
    workflow.addEdge('tool', 'agent');

    // Final answer -> END
    workflow.addEdge('final_answer', END);
  }

  /**
   * Determine if the agent should use tools or move to final answer
   */
  private shouldAct(state: KronosAgentState): string {
    const lastMessage = state.messages[state.messages.length - 1];

    // Handle AIMessage with tool routing logic
    if (lastMessage && isAIMessage(lastMessage)) {
      const aiMessage = lastMessage;
      const toolCalls = aiMessage.tool_calls || [];

      const toolNames = toolCalls.map((tc) => tc.name);

      if (toolNames.includes('signalContextReadiness')) {
        return 'final_answer';
      }

      return 'continue';
    }

    return 'final_answer';
  }

  /**
   * Create the tool execution node with enhanced error handling and context support
   */
  private createToolNode() {
    return async (state: KronosAgentState, config: RunnableConfig) => {
      const lastMessage = state.messages[state.messages.length - 1];

      if (!lastMessage || !isAIMessage(lastMessage)) {
        this.logger.debug('No AI message found, skipping tool execution');
        return {};
      }

      const aiMessage = lastMessage;
      const toolCalls = extractToolCalls(aiMessage);

      if (toolCalls.length === 0) {
        this.logger.debug(
          'No tool calls found in last message, skipping tool execution'
        );
        return {};
      }

      // Get context values for tool execution
      const userId = getContextValue(config, 'userId');

      // Convert tool calls to the format expected by ToolExecutorService
      const toolCallInfos = toolCalls.map(toolCall => ({
        name: toolCall.name,
        args: toolCall.args,
        id: toolCall.id,
        type: 'unknown' as 'inhouse' | 'mcp' // Will be determined by the service
      }));

      try {
        // Use the tools executor service to execute all tools
        const toolResults = await this.toolsExecutorService.executeToolsAndReturnMessages(
          toolCallInfos,
          userId
        );

        this.logger.debug(`Executed ${toolResults.length} tools using ToolExecutorService`);

        return {
          messages: toolResults,
        };
      } catch (error) {
        this.logger.error('Tool execution failed:', error);
        
        // Return error messages for all tool calls
        const errorResults = toolCalls.map(toolCall => 
          new ToolMessage({
            name: toolCall.name,
            content: `Error executing ${toolCall.name}: ${error.message}`,
            tool_call_id: toolCall.id,
          })
        );

        return {
          messages: errorResults,
        };
      }
    };
  }

  /**
   * Create the agent reasoning node with enhanced message handling
   */
  private createAgentNode() {
    return async (state: KronosAgentState, config: RunnableConfig) => {
      const todayDate = getCurrentDate();
      const formattedPrompt = formatSystemPrompt(todayDate);

      const messages = [new SystemMessage(formattedPrompt), ...state.messages];

      const modelWithTools = this.model.bindTools(this.tools, {
        tool_choice: 'any',
      });

      const response = await modelWithTools.invoke(messages, config);

      return {
        messages: [response],
      };
    };
  }

  /**
   * Create the final answer node with LLM-based response synthesis
   */
  private createFinalAnswerNode() {
    return async (state: KronosAgentState, config: RunnableConfig) => {
      const todayDate = getCurrentDate();
      const formattedPrompt = formatSystemPrompt(todayDate);

      const allMessages = state.messages;

      const conversationHistory = [
        new SystemMessage(formattedPrompt),
        ...allMessages,
      ];

      const finalResponse = await this.model.invoke(
        conversationHistory,
        config
      );

      const result = finalResponse.content as string;

      this.logger.log('Final answer generated successfully');
      return {
        result,
        messages: [new AIMessage(result)],
      };
    };
  }
}
