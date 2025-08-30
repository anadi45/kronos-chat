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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  message: string;
  conversation_id: string;
  timestamp: string;
}

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
      conversation_id: chatRequest.conversation_id || `conv_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    return response;
  }

  @Get('conversations')
  async getConversations(@Request() req) {
    // Basic implementation - would fetch from database
    return {
      conversations: [],
      user_id: req.user.id,
    };
  }

  @Get('conversations/:conversationId/messages')
  async getConversationMessages(@Request() req) {
    // Basic implementation - would fetch from database
    return {
      messages: [],
      conversation_id: req.params.conversationId,
    };
  }
}
