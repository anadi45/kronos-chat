/**
 * Stream Event Utilities
 * 
 * This module provides utility functions for working with stream events,
 * including filtering, transformation, and aggregation.
 */

import type { 
  StreamEvent, 
  ContentEvent, 
  ErrorEvent,
  ConversationIdEvent,
  DoneEvent,
  AgentToolCallEvent,
  AgentToolResultEvent
} from './stream.types';
import { StreamEventType } from './stream.types';

// ============================================================================
// Stream Event Filters
// ============================================================================

export class StreamEventFilter {
  static byType(events: StreamEvent[], type: StreamEventType): StreamEvent[] {
    return events.filter(event => event.type === type);
  }

  static byPriority(events: StreamEvent[], priority: string): StreamEvent[] {
    return events.filter(event => event.priority === priority);
  }

  static byStatus(events: StreamEvent[], status: string): StreamEvent[] {
    return events.filter(event => event.status === status);
  }

  static byCorrelationId(events: StreamEvent[], correlationId: string): StreamEvent[] {
    return events.filter(event => event.correlationId === correlationId);
  }

  static byTimeRange(events: StreamEvent[], startTime: string, endTime: string): StreamEvent[] {
    return events.filter(event => 
      event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  static contentEvents(events: StreamEvent[]): ContentEvent[] {
    return this.byType(events, StreamEventType.CONTENT) as ContentEvent[];
  }

  static errorEvents(events: StreamEvent[]): ErrorEvent[] {
    return this.byType(events, StreamEventType.ERROR) as ErrorEvent[];
  }

  static toolCallEvents(events: StreamEvent[]): AgentToolCallEvent[] {
    return this.byType(events, StreamEventType.AGENT_TOOL_CALL) as AgentToolCallEvent[];
  }

  static toolResultEvents(events: StreamEvent[]): AgentToolResultEvent[] {
    return this.byType(events, StreamEventType.AGENT_TOOL_RESULT) as AgentToolResultEvent[];
  }
}

// ============================================================================
// Stream Event Aggregators
// ============================================================================

export class StreamEventAggregator {
  static aggregateContent(events: ContentEvent[]): string {
    return events
      .sort((a, b) => a.data.sequenceNumber - b.data.sequenceNumber)
      .map(event => event.data.content)
      .join('');
  }

  static aggregateToolCalls(events: AgentToolCallEvent[]): Record<string, any[]> {
    const toolCalls: Record<string, any[]> = {};
    
    events.forEach(event => {
      const toolName = event.data.toolName;
      if (!toolCalls[toolName]) {
        toolCalls[toolName] = [];
      }
      toolCalls[toolName].push(event.data);
    });
    
    return toolCalls;
  }

  static aggregateToolResults(events: AgentToolResultEvent[]): Record<string, any[]> {
    const toolResults: Record<string, any[]> = {};
    
    events.forEach(event => {
      const toolName = event.data.toolName;
      if (!toolResults[toolName]) {
        toolResults[toolName] = [];
      }
      toolResults[toolName].push(event.data);
    });
    
    return toolResults;
  }

  static getConversationId(events: StreamEvent[]): string | null {
    const conversationEvents = StreamEventFilter.byType(events, StreamEventType.CONVERSATION_ID) as ConversationIdEvent[];
    return conversationEvents.length > 0 ? conversationEvents[0].data.conversationId : null;
  }

  static getFinalMessage(events: StreamEvent[]): string | null {
    const doneEvents = StreamEventFilter.byType(events, StreamEventType.DONE) as DoneEvent[];
    return doneEvents.length > 0 ? doneEvents[0].data.finalMessage || null : null;
  }

  static getErrors(events: StreamEvent[]): ErrorEvent[] {
    return StreamEventFilter.errorEvents(events);
  }

  static hasErrors(events: StreamEvent[]): boolean {
    return this.getErrors(events).length > 0;
  }

  static getProcessingTime(events: StreamEvent[]): number | null {
    const doneEvents = StreamEventFilter.byType(events, StreamEventType.DONE) as DoneEvent[];
    return doneEvents.length > 0 ? doneEvents[0].data.processingTime || null : null;
  }

  static getTotalTokens(events: StreamEvent[]): number | null {
    const doneEvents = StreamEventFilter.byType(events, StreamEventType.DONE) as DoneEvent[];
    return doneEvents.length > 0 ? doneEvents[0].data.totalTokens || null : null;
  }
}

// ============================================================================
// Stream Event Transformers
// ============================================================================

export class StreamEventTransformer {
  static toSSE(event: StreamEvent): string {
    return `data: ${JSON.stringify(event)}\n\n`;
  }

  static toSSEArray(events: StreamEvent[]): string {
    return events.map(event => this.toSSE(event)).join('');
  }

  static toSSEWithDone(events: StreamEvent[]): string {
    return this.toSSEArray(events) + 'data: [DONE]\n\n';
  }

  static toReadableStream(events: StreamEvent[]): ReadableStream {
    return new ReadableStream({
      start(controller) {
        events.forEach(event => {
          controller.enqueue(new TextEncoder().encode(StreamEventTransformer.toSSE(event)));
        });
        controller.close();
      }
    });
  }

  static toReadableStreamWithDone(events: StreamEvent[]): ReadableStream {
    return new ReadableStream({
      start(controller) {
        events.forEach(event => {
          controller.enqueue(new TextEncoder().encode(StreamEventTransformer.toSSE(event)));
        });
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      }
    });
  }
}

// StreamEventValidator is already defined in stream.types.ts

// ============================================================================
// Stream Event Statistics
// ============================================================================

export class StreamEventStatistics {
  static getEventCounts(events: StreamEvent[]): Record<StreamEventType, number> {
    const counts: Record<string, number> = {};
    
    Object.values(StreamEventType).forEach(type => {
      counts[type] = 0;
    });
    
    events.forEach(event => {
      counts[event.type] = (counts[event.type] || 0) + 1;
    });
    
    return counts as Record<StreamEventType, number>;
  }

  static getEventTimeline(events: StreamEvent[]): Array<{
    timestamp: string;
    type: StreamEventType;
    duration?: number;
  }> {
    return events.map(event => ({
      timestamp: event.timestamp,
      type: event.type,
      duration: event.metadata?.['duration']
    }));
  }

  static getAverageProcessingTime(events: StreamEvent[]): number | null {
    const doneEvents = StreamEventFilter.byType(events, StreamEventType.DONE) as DoneEvent[];
    if (doneEvents.length === 0) return null;
    
    const totalTime = doneEvents.reduce((sum, event) => 
      sum + (event.data.processingTime || 0), 0
    );
    
    return totalTime / doneEvents.length;
  }

  static getContentStatistics(events: StreamEvent[]): {
    totalContentLength: number;
    averageChunkSize: number;
    totalChunks: number;
  } {
    const contentEvents = StreamEventFilter.contentEvents(events);
    
    const totalContentLength = contentEvents.reduce(
      (sum, event) => sum + event.data.content.length, 0
    );
    
    const averageChunkSize = contentEvents.length > 0 
      ? totalContentLength / contentEvents.length 
      : 0;
    
    return {
      totalContentLength,
      averageChunkSize,
      totalChunks: contentEvents.length
    };
  }
}

// ============================================================================
// Stream Event Debugging
// ============================================================================

export class StreamEventDebugger {
  static logEvent(event: StreamEvent, level: 'info' | 'warn' | 'error' = 'info'): void {
    const message = `[${event.type}] ${event.id} - ${event.timestamp}`;
    
    switch (level) {
      case 'info':
        console.log(message, event.data);
        break;
      case 'warn':
        console.warn(message, event.data);
        break;
      case 'error':
        console.error(message, event.data);
        break;
    }
  }

  static logEventSequence(events: StreamEvent[]): void {
    console.log('Stream Event Sequence:');
    events.forEach((event, index) => {
      console.log(`${index + 1}. [${event.type}] ${event.id} - ${event.timestamp}`);
    });
  }

  static logEventStatistics(events: StreamEvent[]): void {
    const counts = StreamEventStatistics.getEventCounts(events);
    const contentStats = StreamEventStatistics.getContentStatistics(events);
    const avgProcessingTime = StreamEventStatistics.getAverageProcessingTime(events);
    
    console.log('Stream Event Statistics:');
    console.log('Event Counts:', counts);
    console.log('Content Statistics:', contentStats);
    console.log('Average Processing Time:', avgProcessingTime);
  }
}
