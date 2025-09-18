import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
  ToolMessage,
} from '@langchain/core/messages';
import { RunnableConfig } from '@langchain/core/runnables';
import { Composio } from '@composio/core';
import {
  LangChainToolConverter,
  ComposioTool,
} from '../utils/langchain-tool-converter';
import {
  KronosAgentState,
  KronosAgentConfig,
  KronosAgentStateSchema,
} from './state';
import type { ChatMessage } from '@kronos/core';
import { MODELS } from '../../constants/models.constants';
import { formatSystemPrompt } from './prompts';
import { getContextValue, extractToolCalls, getCurrentDate, generateConversationId } from './utils';
import { createKronosCheckpointerFromEnv, createKronosCheckpointer } from './checkpointer';

/**
 * Kronos Agent Builder
 *
 * Encapsulates the complex logic for building the Kronos agent graph using LangGraph.
 * This builder creates a workflow with tool execution, agent reasoning, and response generation.
 */
export class KronosAgentBuilder {
  private model: ChatGoogleGenerativeAI;
  private tools: any[] = [];
  private toolProvider: Composio;
  private checkpointer?: any; // PostgreSQL checkpointer instance

  AGENT_NAME = 'kronos_agent';

  constructor() {
    this.initializeProviders();
  }

  /**
   * Build and return the complete Kronos agent graph
   */
  async build(): Promise<any> {
    try {
      console.log('🚀 Starting Kronos agent creation');
      await this.loadTools();
      await this.initializeCheckpointer();

      // Build the workflow graph
      const workflow = new StateGraph(KronosAgentStateSchema);

      await this.addNodes(workflow);
      this.configureEdges(workflow);

      // Compile and return with PostgreSQL checkpointer support
      const compileOptions: any = {
        name: this.AGENT_NAME,
      };
      

    compileOptions.checkpointer = this.checkpointer.getPostgresSaver();
      

      const compiledGraph = workflow.compile(compileOptions);

      console.log('✅ Kronos agent created successfully with PostgreSQL checkpointer');
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
      this.toolProvider = new Composio({
        apiKey: process.env.COMPOSIO_API_KEY,
      });
    } catch (error) {
      throw new Error(`Failed to initialize Providers: ${error.message}`);
    }
  }

  /**
   * Initialize PostgreSQL Checkpointer
   */
  private async initializeCheckpointer(): Promise<void> {
    try {
      this.checkpointer = await createKronosCheckpointer();
      console.log('✅ PostgreSQL checkpointer initialized successfully');
    } catch (error) {
      console.warn('⚠️ Failed to initialize PostgreSQL checkpointer, continuing without persistence:', error);
      this.checkpointer = undefined;
    }
  }

  /**
   * Load all available tools
   */
  private async loadTools(): Promise<void> {
    console.log('🔧 Loading Kronos tools');

    try {
      // Get tools from Composio (using a default user ID for now)
      const composioTools = await this.toolProvider.tools.get('default-user', {
        tools: ['GMAIL_FETCH_EMAILS'],
      });

      // Convert Composio tools to LangChain tools
      this.tools = composioTools.map((tool) =>
        LangChainToolConverter.convert(tool as ComposioTool)
      );

      console.log(`✅ Loaded ${this.tools.length} tools`);
      this.tools.forEach((tool, index) => {
        console.log(`  ${index + 1}. ${tool.name}`);
      });
    } catch (error) {
      console.warn(
        '⚠️ Failed to load Composio tools, continuing without tools:',
        error
      );
      this.tools = [];
    }
  }

  /**
   * Add all nodes to the workflow graph
   */
  private async addNodes(workflow: any): Promise<void> {
    console.log('📝 Adding nodes to Kronos workflow');

    workflow.addNode('agent', this.createAgentNode());
    workflow.addNode('tool', this.createToolNode());
    workflow.addNode('final_answer', this.createFinalAnswerNode());
    workflow.addNode('complete', this.createCompleteNode());
  }

  /**
   * Configure the workflow execution flow
   */
  private configureEdges(workflow: any): void {
    console.log('🔗 Configuring Kronos workflow edges');

    // Set entry point
    workflow.setEntryPoint('agent');

    // Agent -> tools or final answer node
    workflow.addConditionalEdges(
      'agent',
      this.shouldAct,
      {
        'continue': 'tool',
        'final_answer': 'final_answer',
        'complete': 'complete',
      }
    );

    // Tool -> agent (loop back)
    workflow.addEdge('tool', 'agent');

    // Final answer -> complete
    workflow.addEdge('final_answer', 'complete');

    // Complete -> END
    workflow.addEdge('complete', END);
  }

  /**
   * Determine if the agent should use tools or move to final answer
   */
  private shouldAct(state: KronosAgentState): string {
    const lastMessage = state.messages[state.messages.length - 1];

    // Handle AIMessage with tool routing logic
    if (lastMessage && lastMessage instanceof AIMessage) {
      const aiMessage = lastMessage as AIMessage;
      const toolCalls = aiMessage.tool_calls || [];

      if (toolCalls.length > 0) {
        const toolNames = toolCalls.map(tc => tc.name);
        console.log('Routing: Tool calls requested:', toolNames);
        return 'continue';
      } else {
        console.log('Routing: LLM provided a direct answer, proceeding to completion.');
        return 'complete';
      }
    }

    // Default fallback
    console.log('Routing: Proceeding to final answer processing');
    return 'complete';
  }

  /**
   * Create the tool execution node with enhanced error handling and context support
   */
  private createToolNode() {
    return async (state: KronosAgentState, config: RunnableConfig) => {
      console.log('🔧 Executing tool node');

      try {
        const lastMessage = state.messages[state.messages.length - 1];
        
        if (!lastMessage || !(lastMessage instanceof AIMessage)) {
          console.log('No AI message found, skipping tool execution');
          return {};
        }

        const aiMessage = lastMessage as AIMessage;
        const toolCalls = extractToolCalls(aiMessage);

        if (toolCalls.length === 0) {
          console.log('No tool calls found in last message, skipping tool execution');
          return {};
        }

        // Get context values for tool execution
        const authToken = getContextValue(state, config, 'authToken');
        const workspaceId = getContextValue(state, config, 'workspaceId');
        const userId = getContextValue(state, config, 'userId');
        const conversationId = getContextValue(state, config, 'conversationId');

        console.log(`Executing ${toolCalls.length} tool calls with context:`, {
          hasAuthToken: !!authToken,
          workspaceId,
          userId,
          conversationId
        });

        // Execute tools with enhanced error handling
        const toolResults: ToolMessage[] = [];
        
        for (const toolCall of toolCalls) {
          try {
            // Find the tool
            const tool = this.tools.find(t => t.name === toolCall.name);
            if (!tool) {
              console.warn(`Tool ${toolCall.name} not found in available tools`);
              toolResults.push(new ToolMessage({
                content: `Tool ${toolCall.name} not found`,
                tool_call_id: toolCall.id,
              }));
              continue;
            }

            // Execute the tool with context
            console.log(`Executing tool: ${toolCall.name} with args:`, toolCall.args);
            
            // Add context to tool arguments if the tool supports it
            const toolArgs = {
              ...toolCall.args,
              ...(authToken && { authToken }),
              ...(workspaceId && { workspaceId }),
              ...(userId && { userId }),
              ...(conversationId && { conversationId }),
            };

            const result = await tool.invoke(toolArgs);
            
            console.log(`Tool ${toolCall.name} executed successfully`);
            toolResults.push(new ToolMessage({
              content: JSON.stringify(result),
              tool_call_id: toolCall.id,
            }));

          } catch (error) {
            console.error(`Error executing tool ${toolCall.name}:`, error);
            toolResults.push(new ToolMessage({
              content: `Error executing ${toolCall.name}: ${error.message}`,
              tool_call_id: toolCall.id,
            }));
          }
        }

        return {
          messages: toolResults,
        };

      } catch (error) {
        console.error('❌ Tool node execution failed:', error);
        return {
          error: `Tool execution failed: ${error.message}`,
        };
      }
    };
  }

  /**
   * Create the agent reasoning node with enhanced message handling
   */
  private createAgentNode() {
    return async (state: KronosAgentState, config: RunnableConfig) => {
      console.log('🤖 Executing agent node');

      try {
        // Get current date for dynamic prompt
        const todayDate = getCurrentDate();
        const formattedPrompt = formatSystemPrompt(todayDate);
        
        // Build messages array with proper conversation history
        const messages = [
          new SystemMessage(formattedPrompt),
          ...state.messages, // Use existing messages from state
        ];

        // Add current message if not already in messages
        if (state.currentMessage && !messages.some(msg => 
          msg instanceof HumanMessage && msg.content === state.currentMessage
        )) {
          messages.push(new HumanMessage(state.currentMessage));
        }

        console.log(`Agent using conversation history: ${messages.length} messages`);

        // Bind tools to the model with tool choice
        const modelWithTools = this.tools.length > 0 
          ? this.model.bindTools(this.tools, { tool_choice: 'any' })
          : this.model;

        // Generate response
        const response = await modelWithTools.invoke(messages, config);

        console.log('Agent response generated successfully');
        return {
          messages: [response],
        };
      } catch (error) {
        console.error('❌ Agent node execution failed:', error);
        return {
          messages: [new AIMessage(
            'I apologize, but I encountered an error while processing your request.'
          )],
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
      console.log('💬 Executing final answer node');

      try {
        // Generate LLM-based response using conversation history
        const todayDate = getCurrentDate();
        const formattedPrompt = formatSystemPrompt(todayDate);
        
        // Build conversation history for final response generation
        const allMessages = state.messages;
        const conversationHistory = [
          new SystemMessage(formattedPrompt),
          ...allMessages
        ];

        console.log(`Final answer using conversation history: ${conversationHistory.length} messages`);

        // Generate comprehensive final response using LLM
        const finalResponse = await this.model.invoke(conversationHistory, config);

        // Extract content from the response
        let responseContent = 'I apologize, but I was unable to generate a response.';
        if (finalResponse && finalResponse.content) {
          responseContent = finalResponse.content as string;
        }

        console.log('Final answer generated successfully');
        return {
          result: finalResponse,
          response: responseContent,
          messages: [finalResponse],
          isComplete: true,
        };
      } catch (error) {
        console.error('❌ Final answer node execution failed:', error);
        return {
          response: 'I apologize, but I encountered an error while finalizing my response.',
          isComplete: true,
          error: `Final answer generation failed: ${error.message}`,
        };
      }
    };
  }

  /**
   * Create the completion node
   */
  private createCompleteNode() {
    return async (state: KronosAgentState, config: RunnableConfig) => {
      console.log('✅ Graph execution completed');
      return {};
    };
  }

  /**
   * Create a streaming response using the built graph with enhanced context support
   */
  async streamResponse(
    message: string,
    conversationHistory: ChatMessage[] = [],
    userId: string,
    options: {
      authToken?: string;
      workspaceId?: string;
      conversationId?: string;
      threadId?: string;
    } = {}
  ): Promise<ReadableStream> {
    try {
      const graph = await this.build();

      // Create initial state with context
      const initialState: KronosAgentState = {
        messages: [],
        conversationHistory,
        userId,
        currentMessage: message,
        toolCalls: [],
        toolResults: [],
        response: '',
        isComplete: false,
      };

      // Create config with context and thread ID for checkpointer
      const threadId = options.threadId || options.conversationId || generateConversationId();
      const config: RunnableConfig = {
        configurable: {
          authToken: options.authToken,
          workspaceId: options.workspaceId,
          conversationId: options.conversationId,
          userId: userId,
          thread_id: threadId,
        }
      };

      // Create streaming response
      return new ReadableStream({
        async start(controller) {
          try {
            console.log('Starting graph execution with context:', {
              hasAuthToken: !!options.authToken,
              workspaceId: options.workspaceId,
              conversationId: options.conversationId,
              userId: userId,
              threadId: threadId
            });

            // Execute the graph with config
            const result = await graph.invoke(initialState, config);

            // Get the final response from the result
            const finalResponse = result.response || 'I apologize, but I was unable to generate a response.';

            console.log('Graph execution completed, streaming response');

            // Stream the response
            const contentChunk = `data: ${JSON.stringify({
              type: 'content',
              data: finalResponse,
              timestamp: new Date().toISOString(),
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(contentChunk));

            // Send done signal
            const doneChunk = `data: ${JSON.stringify({
              type: 'done',
              timestamp: new Date().toISOString(),
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(doneChunk));

            // Send final [DONE] marker
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            const errorChunk = `data: ${JSON.stringify({
              type: 'error',
              error: 'Failed to generate response',
              timestamp: new Date().toISOString(),
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(errorChunk));
            controller.close();
          }
        },
      });
    } catch (error) {
      console.error('Failed to create streaming response:', error);
      throw error;
    }
  }

  /**
   * Generate conversation ID for the current session
   */
  generateConversationId(): string {
    return generateConversationId();
  }
}
