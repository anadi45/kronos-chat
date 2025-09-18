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
import {
  getContextValue,
  extractToolCalls,
  getCurrentDate,
  generateConversationId,
} from './utils';
import {
  createKronosCheckpointerFromEnv,
  createKronosCheckpointer,
} from './checkpointer';

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
  private userId: string;

  AGENT_NAME = 'kronos_agent';

  constructor(userId: string) {
    this.userId = userId;
    this.initializeProviders();
  }

  /**
   * Build and return the complete Kronos agent graph
   */
  async build(): Promise<any> {
    try {
      console.log('🚀 Starting Kronos agent creation');
      await this.loadTools(this.userId);
      await this.initializeCheckpointer();

      // Build the workflow graph
      const workflow = new StateGraph(KronosAgentStateSchema);

      await this.addNodes(workflow);
      this.configureEdges(workflow);

      // Compile and return with PostgreSQL checkpointer support
      const compileOptions: any = {
        name: this.AGENT_NAME,
      };

      // Only add checkpointer if it's available
      if (this.checkpointer) {
        compileOptions.checkpointer = this.checkpointer.getPostgresSaver();
      }

      const compiledGraph = workflow.compile(compileOptions);

      if (this.checkpointer) {
        console.log(
          '✅ Kronos agent created successfully with PostgreSQL checkpointer'
        );
      } else {
        console.log(
          '✅ Kronos agent created successfully without persistence (checkpointer unavailable)'
        );
      }
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
      console.warn(
        '⚠️ Failed to initialize PostgreSQL checkpointer, continuing without persistence:',
        error
      );
      this.checkpointer = undefined;
    }
  }

  /**
   * Load all available tools for a given user
   */
  private async loadTools(userId: string): Promise<void> {
    console.log('🔧 Loading Kronos tools');

    try {
      // Get tools from Composio (using a default user ID for now)
      const composioTools = await this.toolProvider.tools.get(userId, {
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
    workflow.addConditionalEdges('agent', this.shouldAct, {
      continue: 'tool',
      final_answer: 'final_answer',
      complete: 'complete',
    });

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
        const toolNames = toolCalls.map((tc) => tc.name);
        console.log('Routing: Tool calls requested:', toolNames);
        return 'continue';
      } else {
        console.log(
          'Routing: LLM provided a direct answer, proceeding to completion.'
        );
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
          console.log(
            'No tool calls found in last message, skipping tool execution'
          );
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
          conversationId,
        });

        // Execute tools with enhanced error handling
        const toolResults: ToolMessage[] = [];

        for (const toolCall of toolCalls) {
          try {
            // Find the tool
            const tool = this.tools.find((t) => t.name === toolCall.name);
            if (!tool) {
              console.warn(
                `Tool ${toolCall.name} not found in available tools`
              );
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
              ...(authToken && { authToken }),
              ...(workspaceId && { workspaceId }),
              ...(userId && { userId }),
              ...(conversationId && { conversationId }),
            };

            const result = await tool.invoke(toolArgs);

            console.log(`Tool ${toolCall.name} executed successfully`);
            toolResults.push(
              new ToolMessage({
                content: JSON.stringify(result),
                tool_call_id: toolCall.id,
              })
            );
          } catch (error) {
            console.error(`Error executing tool ${toolCall.name}:`, error);
            toolResults.push(
              new ToolMessage({
                content: `Error executing ${toolCall.name}: ${error.message}`,
                tool_call_id: toolCall.id,
              })
            );
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
        if (
          state.currentMessage &&
          !messages.some(
            (msg) =>
              msg instanceof HumanMessage &&
              msg.content === state.currentMessage
          )
        ) {
          messages.push(new HumanMessage(state.currentMessage));
        }

        console.log(
          `Agent using conversation history: ${messages.length} messages`
        );

        // Bind tools to the model with tool choice
        const modelWithTools =
          this.tools.length > 0
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
      console.log('💬 Executing final answer node');

      try {
        // Generate LLM-based response using conversation history
        const todayDate = getCurrentDate();
        const formattedPrompt = formatSystemPrompt(todayDate);

        // Build conversation history for final response generation
        const allMessages = state.messages;
        const conversationHistory = [
          new SystemMessage(formattedPrompt),
          ...allMessages,
        ];

        console.log(
          `Final answer using conversation history: ${conversationHistory.length} messages`
        );

        // Generate comprehensive final response using LLM
        const finalResponse = await this.model.invoke(
          conversationHistory,
          config
        );

        // Extract content from the response
        let responseContent =
          'I apologize, but I was unable to generate a response.';
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
          response:
            'I apologize, but I encountered an error while finalizing my response.',
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
   * Create a streaming response using LangGraph's proper streaming capabilities
   * Supports multiple stream modes: updates, messages, and custom tool updates
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
      streamModes?: ('updates' | 'messages' | 'custom')[];
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
      const threadId =
        options.threadId || options.conversationId || generateConversationId();
      const config: RunnableConfig = {
        configurable: {
          authToken: options.authToken,
          workspaceId: options.workspaceId,
          conversationId: options.conversationId,
          userId: userId,
          thread_id: threadId,
        },
      };

      // Default stream modes if not specified
      const streamModes = options.streamModes || [
        'updates',
        'messages',
        'custom',
      ];

      // Create streaming response using LangGraph's streaming
      return new ReadableStream({
        async start(controller) {
          try {
            console.log(
              'Starting LangGraph streaming with modes:',
              streamModes
            );
            console.log('Context:', {
              hasAuthToken: !!options.authToken,
              workspaceId: options.workspaceId,
              conversationId: options.conversationId,
              userId: userId,
              threadId: threadId,
            });

            // Use LangGraph's stream method with multiple modes
            const stream = await graph.stream(initialState, {
              ...config,
              streamMode: streamModes,
            });

            let assistantResponse = '';
            let tokenSequence = 0;

            // Process the stream based on the modes
            for await (const [streamMode, chunk] of stream) {
              console.log(`Stream mode: ${streamMode}`, chunk);

              switch (streamMode) {
                case 'updates':
                  // Agent progress updates - emit after each node execution
                  if (chunk && typeof chunk === 'object') {
                    const updateEvent = {
                      type: 'agent_progress',
                      data: {
                        node: chunk.node || 'unknown',
                        status: 'completed',
                        timestamp: new Date().toISOString(),
                      },
                    };
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify(updateEvent)}\n\n`
                      )
                    );
                  }
                  break;

                case 'messages':
                  // LLM tokens - stream tokens as they are generated
                  if (chunk && chunk.content) {
                    const content =
                      typeof chunk.content === 'string'
                        ? chunk.content
                        : String(chunk.content);

                    // Stream content as single token to avoid splitting issues
                    if (content.trim()) {
                      tokenSequence++;
                      const tokenEvent = {
                        type: 'token',
                        data: content,
                        sequence: tokenSequence,
                        timestamp: new Date().toISOString(),
                      };
                      controller.enqueue(
                        new TextEncoder().encode(
                          `data: ${JSON.stringify(tokenEvent)}\n\n`
                        )
                      );
                      assistantResponse += content;
                    }
                  }
                  break;

                case 'custom':
                  // Custom tool updates - emit custom data from tools
                  if (chunk && typeof chunk === 'object') {
                    const customEvent = {
                      type: 'tool_update',
                      data: chunk,
                      timestamp: new Date().toISOString(),
                    };
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify(customEvent)}\n\n`
                      )
                    );
                  }
                  break;
              }
            }

            console.log('LangGraph streaming completed');

            // Send completion event
            const completionEvent = {
              type: 'completion',
              data: {
                response: assistantResponse,
                totalTokens: tokenSequence,
                timestamp: new Date().toISOString(),
              },
            };
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify(completionEvent)}\n\n`
              )
            );

            // Close the stream without duplicate [DONE] markers
            controller.close();
          } catch (error) {
            console.error('LangGraph streaming error:', error);
            const errorEvent = {
              type: 'error',
              data: {
                error: error.message,
                timestamp: new Date().toISOString(),
              },
            };
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify(errorEvent)}\n\n`
              )
            );
            controller.close();
          }
        },
      });
    } catch (error) {
      console.error('Failed to create LangGraph streaming response:', error);
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
