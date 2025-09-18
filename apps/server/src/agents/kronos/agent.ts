import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { ChatMessage } from '@kronos/shared-types';
import { StreamEventBuilder, StreamEventSerializer } from '@kronos/shared-types';
import { Composio } from '@composio/core';
import {
  LangChainToolConverter,
  ComposioTool,
} from '../utils/langchain-tool-converter';

export class KronosAgent {
  private model: ChatGoogleGenerativeAI;
  private systemPrompt: string;

  constructor() {
    // Check if API key is provided
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    try {
      // Initialize Gemini model
      this.model = new ChatGoogleGenerativeAI({
        model: 'gemini-2.0-flash',
        temperature: 0.7,
        maxOutputTokens: 2048,
        apiKey: process.env.GEMINI_API_KEY,
      });

      console.log('✅ KronosAgent initialized successfully with Gemini model');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini model:', error);
      throw new Error(`Failed to initialize Gemini model: ${error.message}`);
    }

    // System prompt for Kronos
    this.systemPrompt = `You are Kronos, a helpful AI assistant. You are knowledgeable, friendly, and provide clear, concise responses. 

Key characteristics:
- You are helpful and supportive
- You provide accurate information
- You are conversational and engaging
- You can help with a wide variety of topics
- You maintain context throughout conversations

Always respond in a helpful and friendly manner.`;
  }

  /**
   * Stream a response using LangChain with Gemini
   * @param message The user's message
   * @param conversationHistory Previous messages in the conversation
   * @returns A ReadableStream of the response
   */
  async streamResponse(
    message: string,
    conversationHistory: ChatMessage[] = [],
    userId: string,
    options: { correlationId?: string } = {}
  ): Promise<ReadableStream> {
    // Build messages array
    const messages = [
      new SystemMessage(this.systemPrompt),
      ...conversationHistory.map((msg) => {
        if (msg.role === 'user') {
          return new HumanMessage(msg.content);
        } else if (msg.role === 'assistant') {
          return new HumanMessage(msg.content);
        }
        return new HumanMessage(msg.content);
      }),
      new HumanMessage(message),
    ];

    // Capture model reference to avoid 'this' context issues
    const model = this.model;

    // Check if model is properly initialized
    if (!model) {
      throw new Error(
        'Model not properly initialized. Please check your GEMINI_API_KEY.'
      );
    }

    const composio = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY,
    });

    const tools = await composio.tools.get(userId, {
      tools: ['GMAIL_FETCH_EMAILS'],
    });

    const langchainTools = tools.map((tool) =>
      LangChainToolConverter.convert(tool as ComposioTool)
    );

    // Create streaming response
    return new ReadableStream({
      async start(controller) {
        try {
          const stream = await model.bindTools(langchainTools).stream(messages);
          let tokenSequence = 0;

          for await (const chunk of stream) {
            if (chunk.content) {
              // Convert content to string
              const content = typeof chunk.content === 'string' ? chunk.content : String(chunk.content);
              
              // Send content event
              const contentEvent = StreamEventBuilder.createContentEvent(
                content,
                'text',
                true,
                tokenSequence++,
                undefined,
                options.correlationId
              );
              controller.enqueue(new TextEncoder().encode(StreamEventSerializer.serialize(contentEvent)));

              // Also send individual tokens for better streaming UX
              const tokens = content.split(/(\s+)/);
              for (const token of tokens) {
                if (token.trim()) {
                  const tokenEvent = StreamEventBuilder.createTokenEvent(
                    token,
                    tokenSequence++,
                    undefined,
                    true,
                    options.correlationId
                  );
                  controller.enqueue(new TextEncoder().encode(StreamEventSerializer.serialize(tokenEvent)));
                }
              }
            }
          }

          // Send done signal
          const doneEvent = StreamEventBuilder.createDoneEvent(
            undefined,
            undefined,
            undefined,
            options.correlationId
          );
          controller.enqueue(new TextEncoder().encode(StreamEventSerializer.serialize(doneEvent)));

          // Send final [DONE] marker
          controller.enqueue(new TextEncoder().encode(StreamEventSerializer.serializeDone()));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorEvent = StreamEventBuilder.createErrorEvent(
            'Failed to generate response',
            'AGENT_ERROR',
            { error: error.message },
            true,
            5000,
            options.correlationId
          );
          controller.enqueue(new TextEncoder().encode(StreamEventSerializer.serialize(errorEvent)));
          controller.close();
        }
      },
    });
  }

  /**
   * Get conversation ID for the current session
   * @returns A unique conversation ID
   */
  generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
