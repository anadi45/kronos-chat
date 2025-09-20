import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  Res,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import type { ChatRequest, PaginatedResponse, Conversation } from '@kronos/core';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  @Post()
  async sendMessage(
    @Request() req,
    @Body() chatRequest: ChatRequest,
    @Res() res: Response,
    @Query('conversationId') conversationId?: string
  ): Promise<void> {
    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    try {
      // Add conversationId to the request if provided as query parameter
      const finalConversationId = conversationId || chatRequest.conversationId;
      const requestWithConversationId = {
        ...chatRequest,
        ...(finalConversationId && { conversationId: finalConversationId })
      };
      
      const stream = await this.chatService.sendMessage(
        requestWithConversationId,
        req.user.id
      );
      const reader = stream.getReader();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        res.write(value);
      }

      res.end();
    } catch (error) {
      console.error('Streaming error:', error);
      res.status(500).json({ error: 'Streaming failed' });
    }
  }

  @Get('conversations')
  async getConversations(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<PaginatedResponse<Conversation>> {
    // Require both page and limit parameters
    if (!page || !limit) {
      throw new BadRequestException('Both page and limit parameters are required');
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    // Validate parameters
    if (isNaN(pageNum) || pageNum < 1) {
      throw new BadRequestException('Page number must be a valid number greater than 0');
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new BadRequestException('Limit must be a valid number between 1 and 100');
    }

    // Use paginated method
    const result = await this.chatService.getConversationsPaginated(
      req.user.id,
      pageNum,
      limitNum
    );
    
    return result;
  }


  @Get('conversations/:conversationId/messages')
  async getConversationMessages(@Request() req, @Param('conversationId') conversationId: string) {
    const conversation = await this.chatService.getConversationMessages(conversationId, req.user.id);
    
    if (!conversation) {
      return {
        messages: [],
        conversationId: conversationId,
        error: 'Conversation not found',
      };
    }

    return {
      messages: conversation.messages,
      conversationId: conversationId,
    };
  }

  @Delete('conversations/:conversationId')
  async deleteConversation(@Request() req, @Param('conversationId') conversationId: string) {
    const result = await this.chatService.deleteConversation(conversationId, req.user.id);
    return result;
  }
}
