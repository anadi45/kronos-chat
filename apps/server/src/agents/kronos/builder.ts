import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { RunnableConfig } from '@langchain/core/runnables';
import { Composio } from '@composio/core';
import {
  LangChainToolConverter,
  ComposioTool,
} from '../utils/langchain-tool-converter';
import { KronosAgentState, KronosAgentConfig, KronosAgentStateSchema } from './state';
import type { ChatMessage } from '@kronos/shared-types';

/**
 * Kronos Agent Builder
 * 
 * Encapsulates the complex logic for building the Kronos agent graph using LangGraph.
 * This builder creates a workflow with tool execution, agent reasoning, and response generation.
 */
export class KronosAgentBuilder {
  private model: ChatGoogleGenerativeAI;
  private systemPrompt: string;
  private tools: any[] = [];
  private composio: Composio;

  AGENT_NAME = 'kronos_agent';

  constructor() {
    this.initializeModel();
    this.initializeComposio();
    this.setupSystemPrompt();
  }

  /**
   * Build and return the complete Kronos agent graph
   */
  async build(): Promise<any> {
    console.log('🚀 Starting Kronos agent creation');

    try {
      await this.loadTools();

      // Build the workflow graph
      const workflow = new StateGraph(KronosAgentStateSchema);
      await this.addNodes(workflow);
      this.configureEdges(workflow);

      // Compile and return
      const compiledGraph = workflow.compile({
        name: this.AGENT_NAME,
      });

      console.log('✅ Kronos agent created successfully');
      return compiledGraph;
    } catch (error) {
      console.error('❌ Failed to create Kronos agent:', error);
      throw error;
    }
  }

  /**
   * Initialize the Gemini model
   */
  private initializeModel(): void {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    try {
      this.model = new ChatGoogleGenerativeAI({
        model: 'gemini-2.0-flash',
        temperature: 0.7,
        maxOutputTokens: 2048,
        apiKey: process.env.GEMINI_API_KEY,
      });

      console.log('✅ KronosAgent model initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini model:', error);
      throw new Error(`Failed to initialize Gemini model: ${error.message}`);
    }
  }

  /**
   * Initialize Composio for tool integration
   */
  private initializeComposio(): void {
    if (!process.env.COMPOSIO_API_KEY) {
      throw new Error('COMPOSIO_API_KEY environment variable is required');
    }

    this.composio = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY,
    });

    console.log('✅ Composio initialized successfully');
  }

  /**
   * Setup the system prompt for Kronos
   */
  private setupSystemPrompt(): void {
    this.systemPrompt = `You are Kronos, a helpful AI assistant. You are knowledgeable, friendly, and provide clear, concise responses. 

Key characteristics:
- You are helpful and supportive
- You provide accurate information
- You are conversational and engaging
- You can help with a wide variety of topics
- You maintain context throughout conversations
- You can use tools to help users with their tasks

Always respond in a helpful and friendly manner. When you need to use tools, do so efficiently and explain what you're doing.`;
  }

  /**
   * Load all available tools
   */
  private async loadTools(): Promise<void> {
    console.log('🔧 Loading Kronos tools');

    try {
      // Get tools from Composio (using a default user ID for now)
      const composioTools = await this.composio.tools.get('default-user', {
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
      console.warn('⚠️ Failed to load Composio tools, continuing without tools:', error);
      this.tools = [];
    }
  }

  /**
   * Add all nodes to the workflow graph
   */
  private async addNodes(workflow: any): Promise<void> {
    console.log('📝 Adding nodes to Kronos workflow');

    workflow.addNode('tool_node', this.createToolNode());
    workflow.addNode('agent_node', this.createAgentNode());
    workflow.addNode('answer_node', this.createAnswerNode());
  }

  /**
   * Configure the workflow execution flow
   */
  private configureEdges(workflow: any): void {
    console.log('🔗 Configuring Kronos workflow edges');

    // Set entry point
    workflow.setEntryPoint('tool_node');

    // Define the flow: tool_node -> agent_node -> answer_node -> END
    workflow.addEdge('tool_node', 'agent_node');
    workflow.addEdge('agent_node', 'answer_node');
    workflow.addEdge('answer_node', END);
  }

  /**
   * Create the tool execution node
   */
  private createToolNode() {
    return async (state: KronosAgentState, config: RunnableConfig) => {
      console.log('🔧 Executing tool node');

      try {
        // Check if tools are available and if the message requires tool usage
        if (this.tools.length === 0) {
          console.log('No tools available, skipping tool execution');
          return {
            toolCalls: [],
            toolResults: [],
          };
        }

        // For now, we'll skip tool execution in the tool node
        // and let the agent node handle tool calls as needed
        return {
          toolCalls: [],
          toolResults: [],
        };
      } catch (error) {
        console.error('❌ Tool node execution failed:', error);
        return {
          toolCalls: [],
          toolResults: [],
          error: `Tool execution failed: ${error.message}`,
        };
      }
    };
  }

  /**
   * Create the agent reasoning node
   */
  private createAgentNode() {
    return async (state: KronosAgentState, config: RunnableConfig) => {
      console.log('🤖 Executing agent node');

      try {
        // Build messages array
        const messages = [
          new SystemMessage(this.systemPrompt),
          ...state.conversationHistory.map((msg) => {
            if (msg.role === 'user') {
              return new HumanMessage(msg.content);
            } else if (msg.role === 'assistant') {
              return new AIMessage(msg.content);
            }
            return new HumanMessage(msg.content);
          }),
          new HumanMessage(state.currentMessage),
        ];

        // Check if model is properly initialized
        if (!this.model) {
          throw new Error('Model not properly initialized. Please check your GEMINI_API_KEY.');
        }

        // Bind tools to the model if available
        const modelWithTools = this.tools.length > 0 
          ? this.model.bindTools(this.tools)
          : this.model;

        // Generate response
        const response = await modelWithTools.invoke(messages);

        return {
          response: response.content as string,
          messages: [...state.messages, response],
        };
      } catch (error) {
        console.error('❌ Agent node execution failed:', error);
        return {
          response: 'I apologize, but I encountered an error while processing your request.',
          error: `Agent execution failed: ${error.message}`,
        };
      }
    };
  }

  /**
   * Create the answer generation node
   */
  private createAnswerNode() {
    return async (state: KronosAgentState, config: RunnableConfig) => {
      console.log('💬 Executing answer node');

      try {
        // The agent node should have already generated the response
        // This node can be used for post-processing, formatting, or final validation
        const finalResponse = state.response || 'I apologize, but I was unable to generate a response.';

        return {
          response: finalResponse,
          isComplete: true,
        };
      } catch (error) {
        console.error('❌ Answer node execution failed:', error);
        return {
          response: 'I apologize, but I encountered an error while finalizing my response.',
          isComplete: true,
          error: `Answer generation failed: ${error.message}`,
        };
      }
    };
  }

  /**
   * Create a streaming response using the built graph
   */
  async streamResponse(
    message: string,
    conversationHistory: ChatMessage[] = [],
    userId: string
  ): Promise<ReadableStream> {
    try {
      const graph = await this.build();
      
      // Create initial state
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

      // Create streaming response
      return new ReadableStream({
        async start(controller) {
          try {
            // Execute the graph
            const result = await graph.invoke(initialState);

            // Stream the response
            const contentChunk = `data: ${JSON.stringify({
              type: 'content',
              data: result.response,
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
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
