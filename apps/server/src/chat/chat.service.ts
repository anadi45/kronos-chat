import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ChatRequest } from '@kronos/core';
import { StreamEventFactory, StreamEventSerializer } from '@kronos/core';
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
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const correlationId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return new ReadableStream({
      async start(controller) {
        const startTime = Date.now();
        let conversation: Conversation;
        let isNewConversation = false;

        try {
          // Get or create conversation
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

          // Send START event
          const startEvent = StreamEventFactory.createStartEvent(
            conversation.id,
            isNewConversation,
          );
          controller.enqueue(new TextEncoder().encode(StreamEventSerializer.serialize(startEvent)));

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
            { correlationId }
          );

          const reader = stream.getReader();
          let assistantResponse = '';
          let tokenSequence = 0;

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            // Decode and process assistant response
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
                        // Stream tokens for better UX
                        const content = parsed.data;
                        const tokens = content.split(/(\s+)/);
                        
                        for (const token of tokens) {
                          if (token.trim()) {
                            tokenSequence++;
                            const tokenEvent = StreamEventFactory.createTokenEvent(token);
                            controller.enqueue(new TextEncoder().encode(StreamEventSerializer.serialize(tokenEvent)));
                            assistantResponse += token;
                          }
                        }
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

          // Send END event
          const processingTime = Date.now() - startTime;
          const endEvent = StreamEventFactory.createEndEvent(conversation.id);
          controller.enqueue(new TextEncoder().encode(StreamEventSerializer.serialize(endEvent)));

          controller.close();
        } catch (error) {
          console.error('Chat service error:', error);

          // Send error event
          // For now, we'll create a simple token event with error message
          const errorEvent = StreamEventFactory.createTokenEvent(`Error: ${error.message}`);
          controller.enqueue(new TextEncoder().encode(StreamEventSerializer.serialize(errorEvent)));

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

  /**
   * Delete a conversation
   * @param conversationId The conversation ID
   * @param userId The user ID
   * @returns Success status
   */
  async deleteConversation(conversationId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const conversation = await this.conversationRepository.findOne({
        where: { id: conversationId, created_by: userId },
      });

      if (!conversation) {
        return { success: false, message: 'Conversation not found' };
      }

      await this.conversationRepository.remove(conversation);
      return { success: true, message: 'Conversation deleted successfully' };
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return { success: false, message: 'Failed to delete conversation' };
    }
  }
}
