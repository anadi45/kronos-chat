export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  timestamp: string;
}

export interface StreamChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  conversationId?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface Conversation {
  id: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}
