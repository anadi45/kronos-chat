import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ChatRequest } from '@kronos/shared-types';
import { KronosAgent } from '../agents/kronos/agent';
import { Conversation, ChatMessage } from '../entities/conversation.entity';
import { ChatMessageRole } from '../enum/roles.enum';

@Injectable()
export class ChatService {
  private kronosAgent: KronosAgent;

  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>
  ) {
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
   * @param userId The user ID
   * @returns A ReadableStream that sends the response
   */
  async sendMessage(request: ChatRequest, userId: string): Promise<ReadableStream> {
    const kronosAgent = this.kronosAgent; // Capture reference to avoid 'this' context issues
    const conversationRepository = this.conversationRepository; // Capture repository reference

    return new ReadableStream({
      async start(controller) {
        try {
          // Get or create conversation
          let conversation: Conversation;
          let isNewConversation = false;

          if (request.conversationId) {
            // Load existing conversation
            conversation = await conversationRepository.findOne({
              where: { id: request.conversationId, created_by: userId }
            });
            
            if (!conversation) {
              throw new Error('Conversation not found');
            }
          } else {
            // Create new conversation
            isNewConversation = true;
            conversation = conversationRepository.create({
              title: null,
              messages: [],
              metadata: {},
              created_by: userId,
              updated_by: userId,
            });
            await conversationRepository.save(conversation);
          }

          // Send conversation ID first
          const conversationIdChunk = `data: ${JSON.stringify({
            type: 'conversationId',
            data: conversation.id,
            timestamp: new Date().toISOString(),
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(conversationIdChunk));

          // Add user message to conversation
          const userMessage: ChatMessage = {
            role: ChatMessageRole.USER,
            content: request.message,
            timestamp: new Date().toISOString(),
          };
          conversation.messages.push(userMessage);

          // Get streaming response from Kronos agent
          const stream = await kronosAgent.streamResponse(
            request.message,
            request.conversationHistory || [],
            userId,
          );

          const reader = stream.getReader();
          let assistantResponse = '';

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            // Decode and accumulate assistant response
            const chunk = new TextDecoder().decode(value);
            if (chunk.includes('data: ')) {
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data !== '[DONE]' && data !== '') {
                    try {
                      const parsed = JSON.parse(data);
                      if (parsed.type === 'content' && parsed.data) {
                        assistantResponse += parsed.data;
                      }
                    } catch (e) {
                      // Skip invalid JSON
                    }
                  }
                }
              }
            }

            controller.enqueue(value);
          }

          // Add assistant message to conversation
          if (assistantResponse) {
            const assistantMessage: ChatMessage = {
              role: ChatMessageRole.AI,
              content: assistantResponse,
              timestamp: new Date().toISOString(),
            };
            conversation.messages.push(assistantMessage);

            // Update conversation title if it's new and this is the first exchange
            if (isNewConversation && conversation.messages.length === 2) {
              conversation.title = request.message.slice(0, 50) + (request.message.length > 50 ? '...' : '');
            }

            // Save updated conversation
            conversation.updated_by = userId;
            await conversationRepository.save(conversation);
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

  /**
   * Get all conversations for a user
   * @param userId The user ID
   * @returns Array of conversations
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: { created_by: userId },
      order: { updated_at: 'DESC' },
    });
  }

  /**
   * Get messages for a specific conversation
   * @param conversationId The conversation ID
   * @param userId The user ID
   * @returns Conversation with messages
   */
  async getConversationMessages(conversationId: string, userId: string): Promise<Conversation | null> {
    return this.conversationRepository.findOne({
      where: { id: conversationId, created_by: userId },
    });
  }
}
