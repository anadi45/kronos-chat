import { Injectable } from '@nestjs/common';
import type { ChatRequest } from '@kronos/shared-types';
import { KronosAgent } from '../agents/kronos/kronos';

@Injectable()
export class ChatService {
  private kronosAgent: KronosAgent;

  constructor() {
    try {
      this.kronosAgent = new KronosAgent();
    } catch (error) {
      console.error('Failed to initialize KronosAgent:', error);
      throw new Error(
        'Failed to initialize AI service. Please check your GEMINI_API_KEY environment variable.'
      );
    }
  }

  /**
   * Send a chat message with streaming response using LangChain and Gemini
   * @param request The chat request
   * @returns A ReadableStream that sends the response
   */
  async sendMessage(request: ChatRequest): Promise<ReadableStream> {
    const conversationId =
      request.conversationId || this.kronosAgent.generateConversationId();
    const kronosAgent = this.kronosAgent; // Capture reference to avoid 'this' context issues

    return new ReadableStream({
      async start(controller) {
        try {
          // Send conversation ID first
          const conversationIdChunk = `data: ${JSON.stringify({
            type: 'conversationId',
            data: conversationId,
            timestamp: new Date().toISOString(),
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(conversationIdChunk));

          // Get streaming response from Kronos agent
          const stream = await kronosAgent.streamResponse(
            request.message,
            request.conversationHistory || []
          );

          const reader = stream.getReader();

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            controller.enqueue(value);
          }

          controller.close();
        } catch (error) {
          console.error('Chat service error:', error);

          // Send error message
          const errorChunk = `data: ${JSON.stringify({
            type: 'error',
            error: 'Failed to generate response',
            timestamp: new Date().toISOString(),
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(errorChunk));

          // Send final [DONE] marker
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });
  }
}
