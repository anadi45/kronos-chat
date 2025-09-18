/**
 * Stream Event Types and Interfaces
 * 
 * This module defines comprehensive interfaces for handling streaming events
 * in the Kronos chat application, providing type safety and validation.
 */

// ============================================================================
// Base Stream Event Types
// ============================================================================

export enum StreamEventType {
  // Core conversation events
  START = 'start',
  END = 'end',
  CONVERSATION_ID = 'conversationId',
  CONTENT = 'content',
  DONE = 'done',
  ERROR = 'error',
  
  // Token streaming events
  TOKEN = 'token',
  MARKDOWN_TOKEN = 'markdown_token',
  
  // Agent execution events
  AGENT_START = 'agentStart',
  AGENT_THINKING = 'agentThinking',
  AGENT_ACTION = 'agentAction',
  AGENT_TOOL_CALL = 'agentToolCall',
  AGENT_TOOL_RESULT = 'agentToolResult',
  
  // System events
  SYSTEM_METADATA = 'systemMetadata',
  SYSTEM_STATUS = 'systemStatus',
  SYSTEM_HEARTBEAT = 'systemHeartbeat',
  
  // User interaction events
  USER_TYPING = 'userTyping',
  USER_ACTION = 'userAction',
  
  // Integration events
  INTEGRATION_CONNECT = 'integrationConnect',
  INTEGRATION_DISCONNECT = 'integrationDisconnect',
  INTEGRATION_ACTION = 'integrationAction',
}

export enum StreamEventPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum StreamEventStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// ============================================================================
// Base Stream Event Interface
// ============================================================================

export interface BaseStreamEvent {
  /** Unique event identifier */
  id: string;
  
  /** Event type from StreamEventType enum */
  type: StreamEventType;
  
  /** Event priority level */
  priority: StreamEventPriority;
  
  /** Event status */
  status: StreamEventStatus;
  
  /** ISO timestamp when event was created */
  timestamp: string;
  
  /** Optional correlation ID for tracking related events */
  correlationId?: string;
  
  /** Optional metadata for additional context */
  metadata?: Record<string, any>;
  
  /** Event version for backward compatibility */
  version: string;
}

// ============================================================================
// Core Conversation Events
// ============================================================================

export interface StartEvent extends BaseStreamEvent {
  type: StreamEventType.START;
  data: {
    conversationId: string;
    isNewConversation: boolean;
    userId: string;
    sessionId: string;
  };
}

export interface EndEvent extends BaseStreamEvent {
  type: StreamEventType.END;
  data: {
    conversationId: string;
    totalTokens?: number;
    processingTime?: number;
    finalMessage?: string;
  };
}

export interface ConversationIdEvent extends BaseStreamEvent {
  type: StreamEventType.CONVERSATION_ID;
  data: {
    conversationId: string;
    isNewConversation: boolean;
    userId: string;
  };
}

export interface TokenEvent extends BaseStreamEvent {
  type: StreamEventType.TOKEN;
  data: {
    token: string;
    sequenceNumber: number;
    totalTokens?: number;
    isPartial: boolean;
  };
}

export interface MarkdownTokenEvent extends BaseStreamEvent {
  type: StreamEventType.MARKDOWN_TOKEN;
  data: {
    token: string;
    sequenceNumber: number;
    totalTokens?: number;
    isPartial: boolean;
    markdownType?: 'text' | 'code' | 'bold' | 'italic' | 'link' | 'list' | 'quote';
  };
}

export interface ContentEvent extends BaseStreamEvent {
  type: StreamEventType.CONTENT;
  data: {
    content: string;
    contentType: 'text' | 'markdown' | 'html' | 'json';
    isPartial: boolean;
    sequenceNumber: number;
    totalSequences?: number;
  };
}

export interface DoneEvent extends BaseStreamEvent {
  type: StreamEventType.DONE;
  data: {
    totalTokens?: number;
    processingTime?: number;
    finalMessage?: string;
  };
}

export interface ErrorEvent extends BaseStreamEvent {
  type: StreamEventType.ERROR;
  data: {
    error: string;
    errorCode?: string;
    errorDetails?: Record<string, any>;
    recoverable: boolean;
    retryAfter?: number;
  };
}

// ============================================================================
// Agent Execution Events
// ============================================================================

export interface AgentStartEvent extends BaseStreamEvent {
  type: StreamEventType.AGENT_START;
  data: {
    agentId: string;
    agentVersion: string;
    capabilities: string[];
    context: Record<string, any>;
  };
}

export interface AgentThinkingEvent extends BaseStreamEvent {
  type: StreamEventType.AGENT_THINKING;
  data: {
    thought: string;
    confidence: number;
    reasoning?: string;
  };
}

export interface AgentActionEvent extends BaseStreamEvent {
  type: StreamEventType.AGENT_ACTION;
  data: {
    action: string;
    parameters: Record<string, any>;
    estimatedDuration?: number;
  };
}

export interface AgentToolCallEvent extends BaseStreamEvent {
  type: StreamEventType.AGENT_TOOL_CALL;
  data: {
    toolName: string;
    toolId: string;
    parameters: Record<string, any>;
    timeout?: number;
  };
}

export interface AgentToolResultEvent extends BaseStreamEvent {
  type: StreamEventType.AGENT_TOOL_RESULT;
  data: {
    toolName: string;
    toolId: string;
    result: any;
    success: boolean;
    executionTime: number;
    error?: string;
  };
}

// ============================================================================
// System Events
// ============================================================================

export interface SystemMetadataEvent extends BaseStreamEvent {
  type: StreamEventType.SYSTEM_METADATA;
  data: {
    systemInfo: {
      version: string;
      environment: string;
      uptime: number;
    };
    performance: {
      memoryUsage: number;
      cpuUsage: number;
      responseTime: number;
    };
  };
}

export interface SystemStatusEvent extends BaseStreamEvent {
  type: StreamEventType.SYSTEM_STATUS;
  data: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, {
      status: string;
      lastCheck: string;
      error?: string;
    }>;
  };
}

export interface SystemHeartbeatEvent extends BaseStreamEvent {
  type: StreamEventType.SYSTEM_HEARTBEAT;
  data: {
    timestamp: string;
    sequence: number;
  };
}

// ============================================================================
// User Interaction Events
// ============================================================================

export interface UserTypingEvent extends BaseStreamEvent {
  type: StreamEventType.USER_TYPING;
  data: {
    userId: string;
    isTyping: boolean;
    typingSpeed?: number;
  };
}

export interface UserActionEvent extends BaseStreamEvent {
  type: StreamEventType.USER_ACTION;
  data: {
    userId: string;
    action: string;
    parameters: Record<string, any>;
    timestamp: string;
  };
}

// ============================================================================
// Integration Events
// ============================================================================

export interface IntegrationConnectEvent extends BaseStreamEvent {
  type: StreamEventType.INTEGRATION_CONNECT;
  data: {
    integrationId: string;
    integrationName: string;
    userId: string;
    connectionStatus: 'connecting' | 'connected' | 'failed';
    error?: string;
  };
}

export interface IntegrationDisconnectEvent extends BaseStreamEvent {
  type: StreamEventType.INTEGRATION_DISCONNECT;
  data: {
    integrationId: string;
    integrationName: string;
    userId: string;
    reason: string;
  };
}

export interface IntegrationActionEvent extends BaseStreamEvent {
  type: StreamEventType.INTEGRATION_ACTION;
  data: {
    integrationId: string;
    action: string;
    parameters: Record<string, any>;
    result?: any;
    success: boolean;
    error?: string;
  };
}

// ============================================================================
// Union Type for All Stream Events
// ============================================================================

export type StreamEvent = 
  | StartEvent
  | EndEvent
  | ConversationIdEvent
  | TokenEvent
  | MarkdownTokenEvent
  | ContentEvent
  | DoneEvent
  | ErrorEvent
  | AgentStartEvent
  | AgentThinkingEvent
  | AgentActionEvent
  | AgentToolCallEvent
  | AgentToolResultEvent
  | SystemMetadataEvent
  | SystemStatusEvent
  | SystemHeartbeatEvent
  | UserTypingEvent
  | UserActionEvent
  | IntegrationConnectEvent
  | IntegrationDisconnectEvent
  | IntegrationActionEvent;

// ============================================================================
// Stream Event Builder and Utilities
// ============================================================================

export class StreamEventBuilder {
  private static generateId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static createBaseEvent(
    type: StreamEventType,
    priority: StreamEventPriority = StreamEventPriority.NORMAL,
    correlationId?: string,
    metadata?: Record<string, any>
  ): Omit<BaseStreamEvent, 'data'> {
    return {
      id: this.generateId(),
      type,
      priority,
      status: StreamEventStatus.PENDING,
      timestamp: new Date().toISOString(),
      correlationId,
      metadata,
      version: '1.0.0',
    };
  }

  static createStartEvent(
    conversationId: string,
    isNewConversation: boolean,
    userId: string,
    sessionId: string,
    correlationId?: string
  ): StartEvent {
    const baseEvent = this.createBaseEvent(
      StreamEventType.START,
      StreamEventPriority.HIGH,
      correlationId
    );
    return {
      ...baseEvent,
      type: StreamEventType.START,
      data: {
        conversationId,
        isNewConversation,
        userId,
        sessionId,
      },
    };
  }

  static createEndEvent(
    conversationId: string,
    totalTokens?: number,
    processingTime?: number,
    finalMessage?: string,
    correlationId?: string
  ): EndEvent {
    const baseEvent = this.createBaseEvent(
      StreamEventType.END,
      StreamEventPriority.HIGH,
      correlationId
    );
    return {
      ...baseEvent,
      type: StreamEventType.END,
      data: {
        conversationId,
        totalTokens,
        processingTime,
        finalMessage,
      },
    };
  }

  static createTokenEvent(
    token: string,
    sequenceNumber: number,
    totalTokens?: number,
    isPartial: boolean = true,
    correlationId?: string
  ): TokenEvent {
    const baseEvent = this.createBaseEvent(
      StreamEventType.TOKEN,
      StreamEventPriority.NORMAL,
      correlationId
    );
    return {
      ...baseEvent,
      type: StreamEventType.TOKEN,
      data: {
        token,
        sequenceNumber,
        totalTokens,
        isPartial,
      },
    };
  }

  static createMarkdownTokenEvent(
    token: string,
    sequenceNumber: number,
    totalTokens?: number,
    isPartial: boolean = true,
    markdownType?: 'text' | 'code' | 'bold' | 'italic' | 'link' | 'list' | 'quote',
    correlationId?: string
  ): MarkdownTokenEvent {
    const baseEvent = this.createBaseEvent(
      StreamEventType.MARKDOWN_TOKEN,
      StreamEventPriority.NORMAL,
      correlationId
    );
    return {
      ...baseEvent,
      type: StreamEventType.MARKDOWN_TOKEN,
      data: {
        token,
        sequenceNumber,
        totalTokens,
        isPartial,
        markdownType,
      },
    };
  }

  static createConversationIdEvent(
    conversationId: string,
    isNewConversation: boolean,
    userId: string,
    correlationId?: string
  ): ConversationIdEvent {
    const baseEvent = this.createBaseEvent(
      StreamEventType.CONVERSATION_ID,
      StreamEventPriority.HIGH,
      correlationId
    );
    return {
      ...baseEvent,
      type: StreamEventType.CONVERSATION_ID,
      data: {
        conversationId,
        isNewConversation,
        userId,
      },
    };
  }

  static createContentEvent(
    content: string,
    contentType: 'text' | 'markdown' | 'html' | 'json' = 'text',
    isPartial: boolean = true,
    sequenceNumber: number = 0,
    totalSequences?: number,
    correlationId?: string
  ): ContentEvent {
    const baseEvent = this.createBaseEvent(
      StreamEventType.CONTENT,
      StreamEventPriority.NORMAL,
      correlationId
    );
    return {
      ...baseEvent,
      type: StreamEventType.CONTENT,
      data: {
        content,
        contentType,
        isPartial,
        sequenceNumber,
        totalSequences,
      },
    };
  }

  static createDoneEvent(
    totalTokens?: number,
    processingTime?: number,
    finalMessage?: string,
    correlationId?: string
  ): DoneEvent {
    const baseEvent = this.createBaseEvent(
      StreamEventType.DONE,
      StreamEventPriority.HIGH,
      correlationId
    );
    return {
      ...baseEvent,
      type: StreamEventType.DONE,
      data: {
        totalTokens,
        processingTime,
        finalMessage,
      },
    };
  }

  static createErrorEvent(
    error: string,
    errorCode?: string,
    errorDetails?: Record<string, any>,
    recoverable: boolean = true,
    retryAfter?: number,
    correlationId?: string
  ): ErrorEvent {
    const baseEvent = this.createBaseEvent(
      StreamEventType.ERROR,
      StreamEventPriority.CRITICAL,
      correlationId
    );
    return {
      ...baseEvent,
      type: StreamEventType.ERROR,
      data: {
        error,
        errorCode,
        errorDetails,
        recoverable,
        retryAfter,
      },
    };
  }

  static createAgentStartEvent(
    agentId: string,
    agentVersion: string,
    capabilities: string[],
    context: Record<string, any> = {},
    correlationId?: string
  ): AgentStartEvent {
    const baseEvent = this.createBaseEvent(
      StreamEventType.AGENT_START,
      StreamEventPriority.HIGH,
      correlationId
    );
    return {
      ...baseEvent,
      type: StreamEventType.AGENT_START,
      data: {
        agentId,
        agentVersion,
        capabilities,
        context,
      },
    };
  }

  static createAgentToolCallEvent(
    toolName: string,
    toolId: string,
    parameters: Record<string, any>,
    timeout?: number,
    correlationId?: string
  ): AgentToolCallEvent {
    const baseEvent = this.createBaseEvent(
      StreamEventType.AGENT_TOOL_CALL,
      StreamEventPriority.NORMAL,
      correlationId
    );
    return {
      ...baseEvent,
      type: StreamEventType.AGENT_TOOL_CALL,
      data: {
        toolName,
        toolId,
        parameters,
        timeout,
      },
    };
  }

  static createAgentToolResultEvent(
    toolName: string,
    toolId: string,
    result: any,
    success: boolean,
    executionTime: number,
    error?: string,
    correlationId?: string
  ): AgentToolResultEvent {
    const baseEvent = this.createBaseEvent(
      StreamEventType.AGENT_TOOL_RESULT,
      StreamEventPriority.NORMAL,
      correlationId
    );
    return {
      ...baseEvent,
      type: StreamEventType.AGENT_TOOL_RESULT,
      data: {
        toolName,
        toolId,
        result,
        success,
        executionTime,
        error,
      },
    };
  }
}

// ============================================================================
// Stream Event Validator
// ============================================================================

export class StreamEventValidator {
  static validate(event: any): event is StreamEvent {
    if (!event || typeof event !== 'object') {
      return false;
    }

    // Check required base fields
    if (!event.id || !event.type || !event.timestamp || !event.version) {
      return false;
    }

    // Check if type is valid
    if (!Object.values(StreamEventType).includes(event.type)) {
      return false;
    }

    // Check if data field exists
    if (!event.data || typeof event.data !== 'object') {
      return false;
    }

    return true;
  }

  static validateContentEvent(event: any): event is ContentEvent {
    if (!this.validate(event)) return false;
    if (event.type !== StreamEventType.CONTENT) return false;
    
    const data = event.data;
    return (
      typeof data.content === 'string' &&
      typeof data.contentType === 'string' &&
      typeof data.isPartial === 'boolean' &&
      typeof data.sequenceNumber === 'number'
    );
  }

  static validateErrorEvent(event: any): event is ErrorEvent {
    if (!this.validate(event)) return false;
    if (event.type !== StreamEventType.ERROR) return false;
    
    const data = event.data;
    return (
      typeof data.error === 'string' &&
      typeof data.recoverable === 'boolean'
    );
  }
}

// ============================================================================
// Stream Event Serializer
// ============================================================================

export class StreamEventSerializer {
  static serialize(event: StreamEvent): string {
    return `data: ${JSON.stringify(event)}\n\n`;
  }

  static serializeDone(): string {
    return 'data: [DONE]\n\n';
  }

  static serializeError(error: string): string {
    const errorEvent = StreamEventBuilder.createErrorEvent(error);
    return this.serialize(errorEvent);
  }
}

// ============================================================================
// Stream Event Parser
// ============================================================================

export class StreamEventParser {
  static parse(chunk: string): StreamEvent | null {
    if (!chunk.startsWith('data: ')) {
      return null;
    }

    const data = chunk.slice(6).trim();
    
    if (data === '[DONE]') {
      return null; // Special marker, not an event
    }

    try {
      const parsed = JSON.parse(data);
      
      if (StreamEventValidator.validate(parsed)) {
        return parsed as StreamEvent;
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to parse stream event:', error);
      return null;
    }
  }

  static async *parseStream(stream: ReadableStream): AsyncGenerator<StreamEvent> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.trim()) {
            const event = this.parse(line);
            if (event) {
              yield event;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
