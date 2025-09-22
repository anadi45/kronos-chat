import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ChatRequest, PaginatedResponse } from '@kronos/core';
import { Provider } from '@kronos/core';
import { StreamEventFactory, StreamEventSerializer } from '@kronos/core';
import { Conversation, ChatMessage } from '../entities/conversation.entity';
import { ChatMessageRole } from '../enum/roles.enum';
import { KronosAgent } from '../agents/kronos/agent';
import { CheckpointerService } from '../checkpointer';
import { ToolsExecutorService } from '../tools/tools-executor.service';
import { ToolsProviderService } from '../tools/tools-provider.service';
import { HumanMessage } from '@langchain/core/messages';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    private readonly checkpointerService: CheckpointerService,
    private readonly toolsExecutorService: ToolsExecutorService,
    private readonly toolsProviderService: ToolsProviderService
  ) {}

  /**
   * Get user's OAuth integrations from the database
   */
  private async getUserIntegrations(userId: string): Promise<Provider[]> {
    try {
      // Use the tools provider service to get user's OAuth integrations
      const userIntegrations = await this.toolsProviderService.getUserOAuthIntegrations(userId);
      
      // Convert string platform names to Provider enum values
      const providerEnums = userIntegrations
        .map(integration => {
          const upperProvider = integration.toUpperCase();
          return Object.values(Provider).find(p => p === upperProvider);
        })
        .filter(Boolean) as Provider[];

      console.log(`Found ${providerEnums.length} user integrations: ${providerEnums.join(', ')}`);
      return providerEnums;
    } catch (error) {
      console.warn('Failed to get user integrations, using empty array:', error.message);
      return [];
    }
  }

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

    // Get user's integrations if no toolkits provided
    let finalToolkits = request.toolkits;
    if (!finalToolkits || finalToolkits.length === 0) {
      finalToolkits = await this.getUserIntegrations(userId);
    }

    const agent = await new KronosAgent({
      userId: userId,
      checkpointerService: this.checkpointerService,
      toolsExecutorService: this.toolsExecutorService,
      toolsProviderService: this.toolsProviderService,
      toolkits: finalToolkits,
    }).getCompiledAgent();

    return new ReadableStream({
      async start(controller) {
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

          const agentInput = {
            messages: new HumanMessage(request.message),
          };

          // Send initial progress update
          const initialProgressEvent =
            StreamEventFactory.createProgressUpdateEvent(
              '🤖 Kronos is analyzing your request...'
            );
          controller.enqueue(
            new TextEncoder().encode(
              StreamEventSerializer.serialize(initialProgressEvent)
            )
          );

          const eventStream = agent.streamEvents(agentInput, {
            configurable: { thread_id: conversation.id },
            context: { userId },
            version: 'v2',
          });

          let progressUpdateSent = false;

          for await (const event of eventStream) {
            // Send progress update when agent starts processing
            if (!progressUpdateSent && event.event === 'on_chain_start') {
              const processingProgressEvent =
                StreamEventFactory.createProgressUpdateEvent(
                  '🧠 Kronos is thinking and planning the response...'
                );
              controller.enqueue(
                new TextEncoder().encode(
                  StreamEventSerializer.serialize(processingProgressEvent)
                )
              );
              progressUpdateSent = true;
            }

            // Handle tool call events
            if (event.event === 'on_chain_stream' && event.data?.chunk) {
              const chunk = event.data.chunk;

              // Check if AI message contains tool calls
              if (chunk.agent?.messages) {
                const messages = chunk.agent.messages;
                for (const message of messages) {
                  if (message.tool_calls && message.tool_calls.length > 0) {
                    const toolNames = message.tool_calls
                      .map((tc) => tc.name)
                      .join(', ');
                    const toolCallProgressEvent =
                      StreamEventFactory.createProgressUpdateEvent(
                        `🔧 Kronos is executing tools: ${toolNames}`
                      );
                    controller.enqueue(
                      new TextEncoder().encode(
                        StreamEventSerializer.serialize(toolCallProgressEvent)
                      )
                    );
                  }
                }
              }

              // Check for tool execution results
              if (chunk.tools?.messages) {
                const toolMessages = chunk.tools.messages;
                for (const message of toolMessages) {
                  if (message.name && message.content) {
                    const toolResultProgressEvent =
                      StreamEventFactory.createProgressUpdateEvent(
                        `✅ Kronos completed tool: ${message.name}`
                      );
                    controller.enqueue(
                      new TextEncoder().encode(
                        StreamEventSerializer.serialize(toolResultProgressEvent)
                      )
                    );
                  }
                }
              }
            }

            try {
              // Only stream from on_chat_model_stream events to avoid duplication
              // These events contain the actual streaming chunks from the model
              if (
                event.event === 'on_chat_model_stream' &&
                event.data?.chunk?.content
              ) {
                const content = event.data.chunk.content;
                if (typeof content === 'string' && content.trim()) {
                  // Send progress update when model starts generating
                  if (assistantMessage === '') {
                    const generatingProgressEvent =
                      StreamEventFactory.createProgressUpdateEvent(
                        '✍️ Kronos is generating response...'
                      );
                    controller.enqueue(
                      new TextEncoder().encode(
                        StreamEventSerializer.serialize(generatingProgressEvent)
                      )
                    );
                  }

                  // Send token event for each content chunk
                  const tokenEvent =
                    StreamEventFactory.createTokenEvent(content);
                  controller.enqueue(
                    new TextEncoder().encode(
                      StreamEventSerializer.serialize(tokenEvent)
                    )
                  );
                  assistantMessage += content;
                }
              }

              // Collect final content from other events for logging but don't stream to avoid duplication
              if (
                event.event === 'on_chat_model_end' &&
                event.data?.output?.content
              ) {
                const content = event.data.output.content;
                if (typeof content === 'string' && content.trim()) {
                  // Only add to assistantMessage if not already included
                  if (!assistantMessage.includes(content)) {
                    assistantMessage += content;
                  }
                }
              }

              // Collect final result from chain stream events but don't stream to avoid duplication
              if (event.event === 'on_chain_stream' && event.data?.chunk) {
                const chunk = event.data.chunk;

                // Check for final_answer result
                if (chunk.final_answer?.result) {
                  const result = chunk.final_answer.result;
                  if (
                    typeof result === 'string' &&
                    result.trim() &&
                    !assistantMessage.includes(result)
                  ) {
                    assistantMessage += result;
                  }
                }

                // Collect agent messages but don't stream to avoid duplication
                if (chunk.agent?.messages) {
                  const messages = chunk.agent.messages;
                  for (const message of messages) {
                    if (
                      message.content &&
                      typeof message.content === 'string' &&
                      message.content.trim()
                    ) {
                      if (!assistantMessage.includes(message.content)) {
                        assistantMessage += message.content;
                      }
                    }
                  }
                }
              }
            } catch (streamError) {
              // Continue processing other events even if one fails
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
            new TextEncoder().encode(StreamEventSerializer.serialize(endEvent))
          );

          controller.close();
        } catch (error) {
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
      return { success: false, message: 'Failed to delete conversation' };
    }
  }
}
