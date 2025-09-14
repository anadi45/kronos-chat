import { KronosAgentBuilder } from './builder';
import type { ChatMessage } from '@kronos/shared-types';

/**
 * Example usage of the KronosAgentBuilder
 */
export async function exampleUsage() {
  try {
    // Initialize the builder
    const builder = new KronosAgentBuilder();
    
    // Build the graph
    const graph = await builder.build();
    console.log('✅ Graph built successfully');
    
    // Example conversation history
    const conversationHistory: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'Hello, how are you?',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        role: 'assistant',
        content: 'I am doing well, thank you! How can I help you today?',
        timestamp: new Date().toISOString(),
      },
    ];
    
    // Create a streaming response
    const stream = await builder.streamResponse(
      'Can you help me with my email?',
      conversationHistory,
      'user-123'
    );
    
    // Handle the stream
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      console.log('Received chunk:', chunk);
    }
    
    console.log('✅ Stream completed successfully');
    
  } catch (error) {
    console.error('❌ Error in example usage:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  exampleUsage();
}
