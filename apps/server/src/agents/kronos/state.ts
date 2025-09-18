import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';
import type { ChatMessage } from '@kronos/shared-types';

export interface KronosAgentState {
  // Core conversation state
  messages: BaseMessage[];
  conversationHistory: ChatMessage[];
  
  // User context
  userId: string;
  currentMessage: string;
  
  // Tool execution state
  toolCalls: any[];
  toolResults: any[];
  
  // Agent response state
  response: string;
  result?: any;
  isComplete: boolean;
  
  // Error handling
  error?: string;
  
  // Streaming state
  streamController?: ReadableStreamDefaultController;
}

export interface KronosAgentConfig {
  userId: string;
  message: string;
  conversationHistory?: ChatMessage[];
}

// Define the state schema for LangGraph using Annotation
export const KronosAgentStateSchema = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  conversationHistory: Annotation<ChatMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  userId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  currentMessage: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  toolCalls: Annotation<any[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  toolResults: Annotation<any[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  response: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  isComplete: Annotation<boolean>({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
  error: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  result: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
});
