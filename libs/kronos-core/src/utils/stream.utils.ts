export enum StreamEventType {
  START = 'start',
  END = 'end',
  TOKEN = 'token',
  MARKDOWN_TOKEN = 'markdown_token',
}

export abstract class StreamEvent {
  public readonly type: StreamEventType;
  public readonly data: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(type: StreamEventType, data: Record<string, unknown>) {
    this.type = type;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  abstract serialize(): string;
}

export class StartEvent extends StreamEvent {
  constructor(
    public readonly conversationId: string,
    public readonly isNewConversation: boolean
  ) {
    super(StreamEventType.START, {
      conversationId,
      isNewConversation,
    });
  }

  serialize(): string {
    return `data: ${JSON.stringify({
      type: this.type,
      data: this.data,
      timestamp: this.timestamp,
    })}\n\n`;
  }
}

export class EndEvent extends StreamEvent {
  constructor(public readonly conversationId: string) {
    super(StreamEventType.END, { conversationId });
  }

  serialize(): string {
    return `data: ${JSON.stringify({
      type: this.type,
      data: this.data,
      timestamp: this.timestamp,
    })}\n\n`;
  }
}

export class TokenEvent extends StreamEvent {
  constructor(public readonly token: string) {
    super(StreamEventType.TOKEN, { token });
  }

  serialize(): string {
    return `data: ${JSON.stringify({
      type: this.type,
      data: this.data,
      timestamp: this.timestamp,
    })}\n\n`;
  }
}

export class MarkdownTokenEvent extends StreamEvent {
  constructor(
    public readonly token: string,
    public readonly markdownType?: 'text' | 'code' | 'bold' | 'italic' | 'link' | 'list' | 'quote'
  ) {
    super(StreamEventType.MARKDOWN_TOKEN, { token, markdownType });
  }

  serialize(): string {
    return `data: ${JSON.stringify({
      type: this.type,
      data: this.data,
      timestamp: this.timestamp,
    })}\n\n`;
  }
}

export class StreamEventFactory {
  static createStartEvent(conversationId: string, isNewConversation: boolean): StartEvent {
    return new StartEvent(conversationId, isNewConversation);
  }

  static createEndEvent(conversationId: string): EndEvent {
    return new EndEvent(conversationId);
  }

  static createTokenEvent(token: string): TokenEvent {
    return new TokenEvent(token);
  }

  static createMarkdownTokenEvent(
    token: string,
    markdownType?: 'text' | 'code' | 'bold' | 'italic' | 'link' | 'list' | 'quote'
  ): MarkdownTokenEvent {
    return new MarkdownTokenEvent(token, markdownType);
  }
}

export class StreamEventValidator {
  static validate(event: unknown): event is StreamEvent {
    if (!event || typeof event !== 'object') {
      return false;
    }

    const eventObj = event as Record<string, unknown>;
    if (!eventObj['type'] || !eventObj['timestamp'] || !eventObj['data']) {
      return false;
    }

    if (!Object.values(StreamEventType).includes(eventObj['type'] as StreamEventType)) {
      return false;
    }

    if (typeof eventObj['data'] !== 'object') {
      return false;
    }

    return true;
  }
}

export class StreamEventParser {
  static parse(chunk: string): StreamEvent | null {
    if (!chunk.startsWith('data: ')) {
      return null;
    }

    const data = chunk.slice(6).trim();
    
    if (data === '[DONE]') {
      return null;
    }

    try {
      const parsed = JSON.parse(data);
      
      if (StreamEventValidator.validate(parsed)) {
        return this.createEventFromData(parsed as StreamEvent);
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to parse stream event:', error);
      return null;
    }
  }

  private static createEventFromData(data: StreamEvent): StreamEvent | null {
    const eventData = data.data as Record<string, unknown>;
    
    switch (data.type) {
      case StreamEventType.START:
        return new StartEvent(
          eventData['conversationId'] as string, 
          eventData['isNewConversation'] as boolean
        );
      case StreamEventType.END:
        return new EndEvent(eventData['conversationId'] as string);
      case StreamEventType.TOKEN:
        return new TokenEvent(eventData['token'] as string);
      case StreamEventType.MARKDOWN_TOKEN:
        return new MarkdownTokenEvent(
          eventData['token'] as string, 
          eventData['markdownType'] as 'text' | 'code' | 'bold' | 'italic' | 'link' | 'list' | 'quote'
        );
      default:
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

// ============================================================================
// Stream Event Filters
// ============================================================================

export class StreamEventFilter {
  static byType(events: StreamEvent[], type: StreamEventType): StreamEvent[] {
    return events.filter(event => event.type === type);
  }

  static byTimeRange(events: StreamEvent[], startTime: string, endTime: string): StreamEvent[] {
    return events.filter(event => 
      event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  static startEvents(events: StreamEvent[]): StartEvent[] {
    return this.byType(events, StreamEventType.START) as StartEvent[];
  }

  static endEvents(events: StreamEvent[]): EndEvent[] {
    return this.byType(events, StreamEventType.END) as EndEvent[];
  }

  static tokenEvents(events: StreamEvent[]): TokenEvent[] {
    return this.byType(events, StreamEventType.TOKEN) as TokenEvent[];
  }

  static markdownTokenEvents(events: StreamEvent[]): MarkdownTokenEvent[] {
    return this.byType(events, StreamEventType.MARKDOWN_TOKEN) as MarkdownTokenEvent[];
  }
}

// ============================================================================
// Stream Event Aggregators
// ============================================================================

export class StreamEventAggregator {
  static aggregateTokens(events: TokenEvent[]): string {
    return events.map(event => event.token).join('');
  }

  static aggregateMarkdownTokens(events: MarkdownTokenEvent[]): string {
    return events.map(event => event.token).join('');
  }

  static getConversationId(events: StreamEvent[]): string | null {
    const startEvents = StreamEventFilter.startEvents(events);
    return startEvents.length > 0 ? startEvents[0].conversationId : null;
  }

  static getTokenCount(events: StreamEvent[]): number {
    const tokenEvents = StreamEventFilter.tokenEvents(events);
    const markdownTokenEvents = StreamEventFilter.markdownTokenEvents(events);
    return tokenEvents.length + markdownTokenEvents.length;
  }

  static getFullMessage(events: StreamEvent[]): string {
    const tokenEvents = StreamEventFilter.tokenEvents(events);
    const markdownTokenEvents = StreamEventFilter.markdownTokenEvents(events);
    
    const allTokens = [...tokenEvents, ...markdownTokenEvents]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(event => event.token);
    
    return allTokens.join('');
  }
}

// ============================================================================
// Stream Event Transformers
// ============================================================================

export class StreamEventTransformer {
  static toSSE(event: StreamEvent): string {
    return event.serialize();
  }

  static toSSEArray(events: StreamEvent[]): string {
    return events.map(event => event.serialize()).join('');
  }

  static toSSEWithDone(events: StreamEvent[]): string {
    return this.toSSEArray(events) + 'data: [DONE]\n\n';
  }

  static toReadableStream(events: StreamEvent[]): ReadableStream {
    return new ReadableStream({
      start(controller) {
        events.forEach(event => {
          controller.enqueue(new TextEncoder().encode(event.serialize()));
        });
        controller.close();
      }
    });
  }

  static toReadableStreamWithDone(events: StreamEvent[]): ReadableStream {
    return new ReadableStream({
      start(controller) {
        events.forEach(event => {
          controller.enqueue(new TextEncoder().encode(event.serialize()));
        });
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      }
    });
  }
}

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
  }> {
    return events.map(event => ({
      timestamp: event.timestamp,
      type: event.type,
    }));
  }

  static getTokenStatistics(events: StreamEvent[]): {
    totalTokens: number;
    averageTokenLength: number;
    tokenEvents: number;
    markdownTokenEvents: number;
  } {
    const tokenEvents = StreamEventFilter.tokenEvents(events);
    const markdownTokenEvents = StreamEventFilter.markdownTokenEvents(events);
    
    const totalTokens = tokenEvents.length + markdownTokenEvents.length;
    const totalTokenLength = [...tokenEvents, ...markdownTokenEvents]
      .reduce((sum, event) => sum + event.token.length, 0);
    
    return {
      totalTokens,
      averageTokenLength: totalTokens > 0 ? totalTokenLength / totalTokens : 0,
      tokenEvents: tokenEvents.length,
      markdownTokenEvents: markdownTokenEvents.length,
    };
  }
}

// ============================================================================
// Stream Event Builder and Serializer
// ============================================================================

export class StreamEventBuilder {
  private events: StreamEvent[] = [];

  addEvent(event: StreamEvent): StreamEventBuilder {
    this.events.push(event);
    return this;
  }

  addStartEvent(conversationId: string, isNewConversation: boolean): StreamEventBuilder {
    return this.addEvent(StreamEventFactory.createStartEvent(conversationId, isNewConversation));
  }

  addEndEvent(conversationId: string): StreamEventBuilder {
    return this.addEvent(StreamEventFactory.createEndEvent(conversationId));
  }

  addTokenEvent(token: string): StreamEventBuilder {
    return this.addEvent(StreamEventFactory.createTokenEvent(token));
  }

  addMarkdownTokenEvent(token: string, markdownType?: 'text' | 'code' | 'bold' | 'italic' | 'link' | 'list' | 'quote'): StreamEventBuilder {
    return this.addEvent(StreamEventFactory.createMarkdownTokenEvent(token, markdownType));
  }

  build(): StreamEvent[] {
    return [...this.events];
  }

  clear(): StreamEventBuilder {
    this.events = [];
    return this;
  }
}

export class StreamEventSerializer {
  static serialize(event: StreamEvent): string {
    return event.serialize();
  }

  static serializeArray(events: StreamEvent[]): string {
    return events.map(event => event.serialize()).join('');
  }

  static serializeWithDone(events: StreamEvent[]): string {
    return this.serializeArray(events) + 'data: [DONE]\n\n';
  }

  static toReadableStream(events: StreamEvent[]): ReadableStream {
    return new ReadableStream({
      start(controller) {
        events.forEach(event => {
          controller.enqueue(new TextEncoder().encode(event.serialize()));
        });
        controller.close();
      }
    });
  }

  static toReadableStreamWithDone(events: StreamEvent[]): ReadableStream {
    return new ReadableStream({
      start(controller) {
        events.forEach(event => {
          controller.enqueue(new TextEncoder().encode(event.serialize()));
        });
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      }
    });
  }
}

// ============================================================================
// Stream Event Debugging
// ============================================================================

export class StreamEventDebugger {
  static logEvent(event: StreamEvent, level: 'info' | 'warn' | 'error' = 'info'): void {
    const message = `[${event.type}] - ${event.timestamp}`;
    
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
      console.log(`${index + 1}. [${event.type}] - ${event.timestamp}`);
    });
  }

  static logEventStatistics(events: StreamEvent[]): void {
    const counts = StreamEventStatistics.getEventCounts(events);
    const tokenStats = StreamEventStatistics.getTokenStatistics(events);
    
    console.log('Stream Event Statistics:');
    console.log('Event Counts:', counts);
    console.log('Token Statistics:', tokenStats);
  }
}
