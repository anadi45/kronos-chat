import React, { useState, useRef, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import type { ChatMessage, ChatRequest } from '@kronos/shared-types';

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
      const streamRequest: ChatRequest = {
        message: userMessage.content,
        conversationHistory: messages,
        conversationId: currentConversationId || undefined,
      };

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      // Get readable stream
      const stream = await apiService.sendChatMessage(streamRequest);
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
    <div className="chat-container">
      {/* Chat Controls */}
      <div className="chat-header">
        <div>
          <p className="text-sm text-gray-300">
            {currentConversationId ? `Conversation: ${currentConversationId.slice(-8)}` : 'New conversation'}
          </p>
        </div>
        <div className="chat-controls">
          {isStreaming && (
            <button
              onClick={handleStopStreaming}
              className="chat-control-btn stop"
            >
              Stop
            </button>
          )}
          <button
            onClick={clearConversation}
            disabled={isStreaming}
            className="chat-control-btn clear"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {messages.length === 0 && !streamingMessage && (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">💬</div>
            <h3>Welcome to Kronos AI</h3>
            <p>
              Start a conversation with our AI assistant. Ask questions, get help, or just chat!
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-message ${message.role}`}
          >
            <div className={`message-bubble ${message.role}`}>
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
              {message.timestamp && (
                <div className="message-timestamp">
                  {formatTimestamp(message.timestamp)}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Streaming Message */}
        {isStreaming && streamingMessage && (
          <div className="chat-message assistant">
            <div className="message-bubble assistant">
              <div className="whitespace-pre-wrap break-words">
                {streamingMessage}
                <span className="chat-streaming-cursor"></span>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isStreaming && !streamingMessage && (
          <div className="chat-message assistant">
            <div className="chat-loading">
              <div className="chat-loading-dots">
                <div className="chat-loading-dot"></div>
                <div className="chat-loading-dot"></div>
                <div className="chat-loading-dot"></div>
              </div>
              <span className="text-sm text-gray-300">Kronos is thinking...</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="chat-error">
            <div>⚠️</div>
            <div>{error}</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
            className="chat-input"
            disabled={isStreaming}
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isStreaming}
            className="chat-send-btn"
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
        
        <div className="chat-disclaimer">
          Kronos AI can make mistakes. Consider checking important information.
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
