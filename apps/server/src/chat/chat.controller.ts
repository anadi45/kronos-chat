import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { ChatRequest, ChatResponse } from '@kronos/shared-types';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  @Post()
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Request() req,
    @Body() chatRequest: ChatRequest
  ): Promise<ChatResponse> {
    // Basic implementation - would integrate with actual AI service
    const response: ChatResponse = {
      message: `Echo: ${chatRequest.message}`,
      conversationId: chatRequest.conversationId || `conv_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    return response;
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
  async getConversationMessages(@Request() req) {
    // Basic implementation - would fetch from database
    return {
      messages: [],
      conversationId: req.params.conversationId,
    };
  }
}
