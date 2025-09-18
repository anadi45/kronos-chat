import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Res,
  Param,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import type { ChatRequest } from '@kronos/shared-types';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  @Post()
  async sendMessage(
    @Request() req,
    @Body() chatRequest: ChatRequest,
    @Res() res: Response
  ): Promise<void> {
    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    try {
      const stream = await this.chatService.sendMessage(
        chatRequest,
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
  async getConversations(@Request() req) {
    // Basic implementation - would fetch from database
    return {
      conversations: [],
      userId: req.user.id,
    };
  }

  @Get('conversations/:conversationId/messages')
  async getConversationMessages(@Request() req, @Param('conversationId') conversationId: string) {
    // Basic implementation - would fetch from database
    return {
      messages: [],
      conversationId: conversationId,
    };
  }
}
