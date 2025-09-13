import { Injectable } from '@nestjs/common';
import type { ChatRequest } from '@kronos/shared-types';

@Injectable()
export class ChatService {
  /**
   * Send a chat message with streaming response
   * @param request The chat request
   * @returns A ReadableStream that sends the response
   */
  async sendMessage(request: ChatRequest): Promise<ReadableStream> {
    const conversationId = request.conversationId || `conv_${Date.now()}`;
    
    // Hardcoded response message
    const responseMessage = 'hi';
    
    return new ReadableStream({
      start(controller) {
        // Send conversation ID first
        const conversationIdChunk = `data: ${JSON.stringify({
          type: 'conversationId',
          data: conversationId,
          timestamp: new Date().toISOString()
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(conversationIdChunk));

        // Simulate streaming by sending each character with a small delay
        let index = 0;
        const streamInterval = setInterval(() => {
          if (index < responseMessage.length) {
            const contentChunk = `data: ${JSON.stringify({
              type: 'content',
              data: responseMessage[index],
              timestamp: new Date().toISOString()
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(contentChunk));
            index++;
          } else {
            // Send done signal
            const doneChunk = `data: ${JSON.stringify({
              type: 'done',
              timestamp: new Date().toISOString()
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(doneChunk));
            
            // Send final [DONE] marker
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            
            clearInterval(streamInterval);
            controller.close();
          }
        }, 50); // 50ms delay between characters for realistic streaming effect

        // Cleanup function
        return () => {
          clearInterval(streamInterval);
        };
      }
    });
  }
}