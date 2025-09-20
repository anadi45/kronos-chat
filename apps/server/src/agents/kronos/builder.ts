import { StateGraph, END, CompiledGraph } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  SystemMessage,
  AIMessage,
  ToolMessage,
  isAIMessage,
} from '@langchain/core/messages';
import { RunnableConfig } from '@langchain/core/runnables';
import { getMathTools } from './math-tools';
import { signalContextReadiness } from '../common/tools';
import { KronosAgentState, KronosAgentStateSchema } from './state';
import { MODELS } from '../../constants/models.constants';
import { formatSystemPrompt } from './prompts';
import { getContextValue, extractToolCalls } from './utils';
import { getCurrentDate } from '@kronos/core';
import { CheckpointerService } from '../../checkpointer';

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
  private userId: string;

  AGENT_NAME = 'kronos_agent';

  constructor(userId: string, checkpointerService: CheckpointerService) {
    this.userId = userId;
    this.checkpointerService = checkpointerService;
    this.initializeProviders();
  }

  /**
   * Build and return the complete Kronos agent graph
   */
  async build(): Promise<ReturnType<StateGraph<any>['compile']>> {
    try {
      await this.loadTools(this.userId);

      // Build the workflow graph
      const workflow = new StateGraph(KronosAgentStateSchema);

      await this.addNodes(workflow);
      this.configureEdges(workflow);

      // Compile and return with PostgreSQL checkpointer support
      const compileOptions: any = {
        name: this.AGENT_NAME,
        checkpointer: this.checkpointerService.getCheckpointer(),
      };

      console.log(
        '✅ Kronos agent created successfully with PostgreSQL checkpointer'
      );

      const compiledGraph = workflow.compile(compileOptions);
      return compiledGraph;
    } catch (error) {
      console.error('❌ Failed to create Kronos agent:', error);
      throw error;
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
      });
    } catch (error) {
      throw new Error(`Failed to initialize Providers: ${error.message}`);
    }
  }

  /**
   * Load all available tools for a given user
   */
  private async loadTools(userId: string): Promise<void> {
    console.log('🔧 Loading Kronos tools');

    try {
      // Load custom math tools
      const mathTools = getMathTools();

      // Load common tools
      const commonTools = [signalContextReadiness.tool];

      // Combine all tools
      this.tools = [...mathTools, ...commonTools];

      console.log(`✅ Loaded ${this.tools.length} tools`);
      this.tools.forEach((tool, index) => {
        console.log(`  ${index + 1}. ${tool.name}`);
      });
    } catch (error) {
      console.warn('⚠️ Failed to load tools, continuing without tools:', error);
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

    // TODO: Need to fix if case here. It should always call some tool.

    // Handle AIMessage with tool routing logic
    if (lastMessage && isAIMessage(lastMessage)) {
      const aiMessage = lastMessage;
      const toolCalls = aiMessage.tool_calls || [];

      const toolNames = toolCalls.map((tc) => tc.name);
      console.log('Routing: Tool calls requested:', toolNames);

      if (toolNames.includes(signalContextReadiness.name)) {
        console.log(
          'Routing: signalContextReadiness called, proceeding to final answer'
        );
        return 'final_answer';
      }

      return 'continue';
    }

    // Default fallback
    console.log('Routing: Proceeding to final answer processing');
    return 'final_answer';
  }

  /**
   * Create the tool execution node with enhanced error handling and context support
   */
  private createToolNode() {
    return async (state: KronosAgentState, config: RunnableConfig) => {
      console.log('🔧 Executing tool node');

      const lastMessage = state.messages[state.messages.length - 1];

      if (!lastMessage || !isAIMessage(lastMessage)) {
        console.log('No AI message found, skipping tool execution');
        return {};
      }

      const aiMessage = lastMessage;
      const toolCalls = extractToolCalls(aiMessage);

      if (toolCalls.length === 0) {
        console.log(
          'No tool calls found in last message, skipping tool execution'
        );
        return {};
      }

      // Get context values for tool execution
      const userId = getContextValue(config, 'userId');

      console.log(`Executing ${toolCalls.length} tool calls with context:`, {
        userId,
      });

      // Execute tools with enhanced error handling
      const toolResults: ToolMessage[] = [];

      for (const toolCall of toolCalls) {
        try {
          // Find the tool
          const tool = this.tools.find((t) => t.name === toolCall.name);
          if (!tool) {
            console.warn(`Tool ${toolCall.name} not found in available tools`);
            toolResults.push(
              new ToolMessage({
                content: `Tool ${toolCall.name} not found`,
                tool_call_id: toolCall.id,
              })
            );
            continue;
          }

          // Execute the tool with context
          console.log(
            `Executing tool: ${toolCall.name} with args:`,
            toolCall.args
          );

          // Add context to tool arguments if the tool supports it
          const toolArgs = {
            ...toolCall.args,
            ...(userId && { userId }),
          };

          const result = await tool.invoke(toolArgs);

          console.log(`Tool ${toolCall.name} executed successfully`);
          toolResults.push(
            new ToolMessage({
              name: toolCall.name,
              content: JSON.stringify(result),
              tool_call_id: toolCall.id,
            })
          );
        } catch (error) {
          console.error(`Error executing tool ${toolCall.name}:`, error);
          toolResults.push(
            new ToolMessage({
              name: toolCall.name,
              content: `Error executing ${toolCall.name}: ${error.message}`,
              tool_call_id: toolCall.id,
            })
          );
        }
      }

      return {
        messages: toolResults,
      };
    };
  }

  /**
   * Create the agent reasoning node with enhanced message handling
   */
  private createAgentNode() {
    return async (state: KronosAgentState, config: RunnableConfig) => {
      try {
        const todayDate = getCurrentDate();
        const formattedPrompt = formatSystemPrompt(todayDate);

        const messages = [
          new SystemMessage(formattedPrompt),
          ...state.messages,
        ];

        console.log(
          `Agent using conversation history: ${messages.length} messages`
        );

        const modelWithTools = this.model.bindTools(this.tools, {
          tool_choice: 'any',
        });

        const response = await modelWithTools.invoke(messages, config);

        console.log('Agent response generated successfully');
        return {
          messages: [response],
        };
      } catch (error) {
        console.error('❌ Agent node execution failed:', error);
        return {
          messages: [
            new AIMessage(
              'I apologize, but I encountered an error while processing your request.'
            ),
          ],
          error: `Agent execution failed: ${error.message}`,
        };
      }
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

      console.log('All messages:', allMessages);
      const conversationHistory = [
        new SystemMessage(formattedPrompt),
        ...allMessages,
      ];

      console.log(
        `Final answer using conversation history: ${conversationHistory.length} messages`
      );

      const finalResponse = await this.model.invoke(
        conversationHistory,
        config
      );
      console.log('Final response:', finalResponse);

      let result = 'I apologize, but I was unable to generate a response.';
      if (finalResponse && isAIMessage(finalResponse)) {
        result = finalResponse.content as string;
      }

      console.log('Final answer generated successfully');
      return {
        result,
        messages: [new AIMessage(result)],
      };
    };
  }
}
