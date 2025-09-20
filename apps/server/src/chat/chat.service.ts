import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ChatRequest, PaginatedResponse } from '@kronos/core';
import { StreamEventFactory, StreamEventSerializer } from '@kronos/core';
import { Conversation, ChatMessage } from '../entities/conversation.entity';
import { ChatMessageRole } from '../enum/roles.enum';
import { KronosAgent } from '../agents/kronos/agent';
import { CheckpointerService } from '../checkpointer';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    private readonly checkpointerService: CheckpointerService
  ) {}

  /**
   * Send a chat message with streaming response using LangGraph streaming
   * @param request The chat request
   * @param userId The user ID
   * @returns A ReadableStream that sends the response
   */
  async sendMessage(
    request: ChatRequest,
    userId: string
  ): Promise<ReadableStream> {
    const conversationRepository = this.conversationRepository;

    const agent = new KronosAgent(userId, this.checkpointerService).getCompiledAgent();

    return new ReadableStream({
      async start(controller) {
        // const startTime = Date.now();
        let conversation: Conversation;
        let isNewConversation = false;

        try {
          if (request.conversationId) {
            conversation = await conversationRepository.findOne({
              where: { id: request.conversationId, createdBy: userId },
            });

            if (!conversation) {
              throw new Error('Conversation not found');
            }
          } else {
            isNewConversation = true;
            conversation = conversationRepository.create({
              title: null,
              messages: [],
              metadata: {},
              createdBy: userId,
              updatedBy: userId,
            });
            await conversationRepository.save(conversation);
          }

          const startEvent = StreamEventFactory.createStartEvent(
            conversation.id,
            isNewConversation
          );
          controller.enqueue(
            new TextEncoder().encode(
              StreamEventSerializer.serialize(startEvent)
            )
          );

          const userMessage: ChatMessage = {
            role: ChatMessageRole.USER,
            content: request.message,
            timestamp: new Date().toISOString(),
          };

          conversation.messages.push(userMessage);

          let assistantMessage = '';
          
          for await (const [streamMode, chunk] of await (agent as unknown as any).stream(
            { messages: [request.message] },
            { streamMode: ["updates", "messages"] }
          )) {
            console.log(streamMode, chunk);
            
            if (streamMode === "messages" && chunk?.messages) {
              for (const message of chunk.messages) {
                if (message.role === 'assistant' && message.content) {
                  assistantMessage += message.content;
                  
                  // Send token event
                  const tokenEvent = StreamEventFactory.createTokenEvent(message.content);
                  controller.enqueue(
                    new TextEncoder().encode(
                      StreamEventSerializer.serialize(tokenEvent)
                    )
                  );
                }
              }
            }
          }

          // Add assistant message to conversation
          const assistantChatMessage: ChatMessage = {
            role: ChatMessageRole.AI,
            content: assistantMessage,
            timestamp: new Date().toISOString(),
          };
          conversation.messages.push(assistantChatMessage);
          await conversationRepository.save(conversation);

          // Send end event
          const endEvent = StreamEventFactory.createEndEvent(conversation.id);
          controller.enqueue(
            new TextEncoder().encode(
              StreamEventSerializer.serialize(endEvent)
            )
          );


          controller.close();
        } catch (error) {
          console.error('Chat service error:', error);

          // Send error event
          const errorEvent = StreamEventFactory.createTokenEvent(
            `Error: ${error.message}`
          );
          controller.enqueue(
            new TextEncoder().encode(
              StreamEventSerializer.serialize(errorEvent)
            )
          );

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
      where: { createdBy: userId },
      order: { updatedAt: 'DESC' },
    });
  }

  /**
   * Get paginated conversations for a user
   * @param userId The user ID
   * @param page Page number (1-based)
   * @param limit Number of records per page
   * @returns Paginated conversations
   */
  async getConversationsPaginated(
    userId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Conversation>> {
    const skip = (page - 1) * limit;

    const [conversations, total] =
      await this.conversationRepository.findAndCount({
        where: { createdBy: userId },
        order: { updatedAt: 'DESC' },
        skip,
        take: limit,
      });

    const totalPages = Math.ceil(total / limit);

    return {
      items: conversations,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get messages for a specific conversation
   * @param conversationId The conversation ID
   * @param userId The user ID
   * @returns Conversation with messages
   */
  async getConversationMessages(
    conversationId: string,
    userId: string
  ): Promise<Conversation | null> {
    return this.conversationRepository.findOne({
      where: { id: conversationId, createdBy: userId },
    });
  }

  /**
   * Delete a conversation
   * @param conversationId The conversation ID
   * @param userId The user ID
   * @returns Success status
   */
  async deleteConversation(
    conversationId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const conversation = await this.conversationRepository.findOne({
        where: { id: conversationId, createdBy: userId },
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
