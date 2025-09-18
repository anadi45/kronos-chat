export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  timestamp: string;
}


export interface Conversation {
  id: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface ConversationsResponse {
  data: Conversation[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

