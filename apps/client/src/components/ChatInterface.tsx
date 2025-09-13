import React, { useState, useRef, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import type { ChatMessage, StreamChatRequest } from '@kronos/shared-types';

interface ChatInterfaceProps {
  userId?: string;
}

interface StreamChunk {
  type: 'conversationId' | 'content' | 'done' | 'error';
  data?: string;
  conversationId?: string;
  timestamp?: string;
  error?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage, scrollToBottom]);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message to the conversation
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setError(null);
    setIsStreaming(true);
    setStreamingMessage('');

    try {
      // Create stream request
      const streamRequest: StreamChatRequest = {
        message: userMessage.content,
        conversationHistory: messages,
        conversationId: currentConversationId || undefined,
        systemPrompt: "You are Kronos, a helpful AI assistant. You are knowledgeable, friendly, and provide clear, concise responses."
      };

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      // Get readable stream
      const stream = await apiService.streamChatMessage(streamRequest);
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      let assistantMessage = '';
      let conversationId = currentConversationId;

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                break;
              }

              try {
                const parsed: StreamChunk = JSON.parse(data);
                
                switch (parsed.type) {
                  case 'conversationId':
                    conversationId = parsed.data || '';
                    setCurrentConversationId(conversationId);
                    break;
                    
                  case 'content':
                    assistantMessage += parsed.data || '';
                    setStreamingMessage(assistantMessage);
                    break;
                    
                  case 'done':
                    // Finalize the assistant message
                    const finalMessage: ChatMessage = {
                      role: 'assistant',
                      content: assistantMessage,
                      timestamp: parsed.timestamp || new Date().toISOString()
                    };
                    setMessages(prev => [...prev, finalMessage]);
                    setStreamingMessage('');
                    setIsStreaming(false);
                    return;
                    
                  case 'error':
                    throw new Error(parsed.error || 'Unknown streaming error');
                }
              } catch (parseError) {
                console.warn('Failed to parse stream chunk:', data, parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // If we reach here without a 'done' message, finalize anyway
      if (assistantMessage) {
        const finalMessage: ChatMessage = {
          role: 'assistant',
          content: assistantMessage,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, finalMessage]);
        setStreamingMessage('');
      }

    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      console.error('Chat error:', err);
    } finally {
      setIsStreaming(false);
      setStreamingMessage('');
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setCurrentConversationId('');
    setStreamingMessage('');
    setError(null);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Chat Controls */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <p className="text-sm text-gray-300">
            {currentConversationId ? `Conversation: ${currentConversationId.slice(-8)}` : 'New conversation'}
          </p>
        </div>
        <div className="flex space-x-2">
          {isStreaming && (
            <button
              onClick={handleStopStreaming}
              className="px-3 py-1 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 text-sm border border-red-500/30"
            >
              Stop
            </button>
          )}
          <button
            onClick={clearConversation}
            disabled={isStreaming}
            className="px-3 py-1 bg-white/10 text-gray-300 rounded-md hover:bg-white/20 disabled:opacity-50 text-sm border border-white/20"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !streamingMessage && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-medium text-white mb-2">
              Welcome to Kronos AI
            </h3>
            <p className="text-gray-300 max-w-md mx-auto">
              Start a conversation with our AI assistant. Ask questions, get help, or just chat!
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-3xl ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}>
              <div
                className={`rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-white border border-white/20'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
                {message.timestamp && (
                  <div className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    {formatTimestamp(message.timestamp)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Streaming Message */}
        {isStreaming && streamingMessage && (
          <div className="flex justify-start">
            <div className="max-w-3xl mr-12">
              <div className="rounded-lg px-4 py-2 bg-white/10 text-white border border-white/20">
                <div className="whitespace-pre-wrap break-words">
                  {streamingMessage}
                  <span className="inline-block w-2 h-5 bg-white/60 ml-1 animate-pulse">|</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isStreaming && !streamingMessage && (
          <div className="flex justify-start">
            <div className="max-w-3xl mr-12">
              <div className="rounded-lg px-4 py-3 bg-white/10 text-white border border-white/20">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-300">Kronos is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-400 mr-2">⚠️</div>
              <div className="text-red-300">{error}</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 bg-white/5 p-4">
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none min-h-[50px] max-h-32 text-white placeholder-gray-400"
              disabled={isStreaming}
              rows={1}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isStreaming}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isStreaming ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>Send</span>
              </>
            )}
          </button>
        </div>
        
        <div className="text-xs text-gray-400 mt-2 text-center">
          Kronos AI can make mistakes. Consider checking important information.
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
