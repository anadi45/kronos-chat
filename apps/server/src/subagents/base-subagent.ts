import { StateGraph, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  SystemMessage,
  AIMessage,
  ToolMessage,
  isAIMessage,
} from '@langchain/core/messages';
import { Runnable, RunnableConfig } from '@langchain/core/runnables';
import { Logger } from '@nestjs/common';
import { CheckpointerService } from '../checkpointer';
import { ToolsExecutorService } from '../tools/tools-executor.service';
import { ToolsProviderService } from '../tools/tools-provider.service';
import { Provider } from '@kronos/core';
import { getContextValue, extractToolCalls } from '../agents/common/utils';
import { getCurrentDate } from '@kronos/core';
import { MODELS } from '../constants/models.constants';
import { SubagentState, SubagentStateSchema } from './state';

export interface SubagentConfig {
  userId: string;
  checkpointerService: CheckpointerService;
  toolsExecutorService: ToolsExecutorService;
  toolsProviderService: ToolsProviderService;
  provider: Provider;
}

/**
 * Base Subagent class for integration-specific agents
 * Each subagent handles a specific integration type (Gmail, GitHub, etc.)
 */
export abstract class BaseSubagent {
  protected model: ChatGoogleGenerativeAI;
  protected answerModel: Runnable;
  protected tools: any[] = [];
  protected checkpointerService: CheckpointerService;
  protected toolsExecutorService: ToolsExecutorService;
  protected toolsProviderService: ToolsProviderService;
  protected userId: string;
  protected provider: Provider;
  protected readonly logger = new Logger(this.constructor.name);

  constructor({
    userId,
    checkpointerService,
    toolsExecutorService,
    toolsProviderService,
    provider,
  }: SubagentConfig) {
    this.userId = userId;
    this.checkpointerService = checkpointerService;
    this.toolsExecutorService = toolsExecutorService;
    this.toolsProviderService = toolsProviderService;
    this.provider = provider;
    this.initializeProviders();
  }

  /**
   * Initialize AI models
   */
  private initializeProviders(): void {
    try {
      // Validate API key before creating models
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
      }

      this.model = new ChatGoogleGenerativeAI({
        model: MODELS.GEMINI_2_0_FLASH,
        maxOutputTokens: 2048,
        temperature: 0,
        apiKey: process.env.GEMINI_API_KEY,
        streaming: true,
        maxRetries: 3,
      });

      this.answerModel = new ChatGoogleGenerativeAI({
        model: MODELS.GEMINI_2_0_FLASH,
        temperature: 0,
        apiKey: process.env.GEMINI_API_KEY,
        streaming: true,
        maxRetries: 3,
      });
    } catch (error) {
      console.error('Failed to initialize AI models for subagent:', error);
      throw new Error(`Failed to initialize AI models: ${error.message}`);
    }
  }

  /**
   * Load tools specific to this subagent's provider
   */
  protected async loadTools(): Promise<void> {
    try {
      this.tools = await this.toolsProviderService.getAvailableTools(
        this.userId,
        [this.provider],
        `${this.provider.toLowerCase()}_subagent`
      );
      this.logger.log(
        `Loaded ${this.tools.length} tools for ${this.provider} subagent`
      );
    } catch (error) {
      this.logger.warn(
        `Failed to load tools for ${this.provider}, continuing without tools`,
        error.message
      );
      this.tools = [];
    }
  }

  /**
   * Build and return the compiled subagent graph
   */
  async build(): Promise<ReturnType<StateGraph<any>['compile']>> {
    try {
      await this.loadTools();

      const workflow = new StateGraph(SubagentStateSchema);

      await this.addNodes(workflow);
      this.configureEdges(workflow);

      const compileOptions: any = {
        name: `${this.provider.toLowerCase()}_subagent`,
        checkpointer: this.checkpointerService.getCheckpointer(),
      };

      const compiledGraph = workflow.compile(compileOptions);
      return compiledGraph;
    } catch (error) {
      throw new Error(
        `Failed to build ${this.provider} subagent: ${error.message}`
      );
    }
  }

  /**
   * Add nodes to the workflow graph
   */
  protected async addNodes(workflow: any): Promise<void> {
    workflow.addNode('agent', this.createAgentNode());
    workflow.addNode('tool', this.createToolNode());
    workflow.addNode('final_answer', this.createFinalAnswerNode());
  }

  /**
   * Configure the workflow execution flow
   */
  protected configureEdges(workflow: any): void {
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
  protected shouldAct(state: SubagentState): string {
    const lastMessage = state.messages[state.messages.length - 1];

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
   * Create the tool execution node
   */
  protected createToolNode() {
    return async (state: SubagentState, config: RunnableConfig) => {
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

      const userId = getContextValue(config, 'userId');

      const toolCallInfos = toolCalls.map((toolCall) => ({
        name: toolCall.name,
        args: toolCall.args,
        id: toolCall.id,
        type: (this.toolsProviderService.isInhouseTool(toolCall.name)
          ? 'inhouse'
          : 'mcp') as 'inhouse' | 'mcp',
      }));

      try {
        const toolResults =
          await this.toolsExecutorService.executeToolsAndReturnMessages(
            toolCallInfos,
            userId
          );

        this.logger.debug(
          `Executed ${toolResults.length} tools for ${this.provider} subagent`
        );

        return {
          messages: toolResults,
        };
      } catch (error) {
        this.logger.error(`Tool execution failed for ${this.provider}:`, error);

        const errorResults = toolCalls.map(
          (toolCall) =>
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
   * Create the agent reasoning node
   */
  protected createAgentNode() {
    return async (state: SubagentState, config: RunnableConfig) => {
      const todayDate = getCurrentDate();
      const formattedPrompt = this.getSystemPrompt(todayDate);

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
   * Create the final answer node - context-aware response handling
   * Returns raw AI messages when called by parent agent (Kronos)
   * Uses LLM summarization when called directly
   */
  protected createFinalAnswerNode() {
    return async (state: SubagentState, config: RunnableConfig) => {
      // Check if this subagent is being called by a parent agent
      const isCalledByParent = this.isCalledByParentAgent(state, config);

      if (isCalledByParent) {
        // When called by parent agent (like Kronos), return raw AI messages
        const aiMessages = state.messages.filter((msg) => isAIMessage(msg));
        const result = aiMessages.map((msg) => msg.content).join('\n\n');

        this.logger.log(
          `${this.provider} subagent returning AI messages for parent agent`
        );
        return {
          result,
          messages: [new AIMessage(result)],
        };
      } else {
        // When called directly, use LLM to provide a proper summary
        const todayDate = getCurrentDate();
        const formattedPrompt = this.getFinalAnswerPrompt(todayDate);

        const allMessages = state.messages;
        const conversationHistory = [
          new SystemMessage(formattedPrompt),
          ...allMessages,
        ];

        const finalResponse = await this.answerModel.invoke(
          conversationHistory,
          config
        );

        const result = finalResponse.content as string;

        this.logger.log(
          `${this.provider} subagent final answer generated successfully`
        );
        return {
          result,
          messages: [new AIMessage(result)],
        };
      }
    };
  }

  /**
   * Determine if this subagent is being called by a parent agent
   * This can be detected by checking for delegation context or specific patterns
   */
  private isCalledByParentAgent(
    state: SubagentState,
    config: RunnableConfig
  ): boolean {
    // Check if there's a delegation context in the config
    const delegationContext = getContextValue(config, 'delegationContext');
    if (delegationContext) {
      return true;
    }

    // Check if the initial message contains delegation patterns
    const firstMessage = state.messages[0];
    if (firstMessage && firstMessage.content) {
      const content = firstMessage.content.toString();
      // Look for patterns that indicate delegation from Kronos
      return content.includes('Context:') || content.includes('delegation');
    }

    // Default to direct call if no delegation indicators found
    return false;
  }

  /**
   * Get the system prompt for this subagent
   * Must be implemented by each subagent
   */
  protected abstract getSystemPrompt(todayDate: string): string;

  /**
   * Get the final answer prompt for this subagent
   * Must be implemented by each subagent
   */
  protected abstract getFinalAnswerPrompt(todayDate: string): string;
}
