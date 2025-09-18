import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { apiService } from '../services/apiService';
import type { 
  ChatMessage, 
  ChatRequest, 
  Conversation
} from '@kronos/core';
import { StreamEvent, StreamEventType } from '@kronos/core';

interface ChatInterfaceProps {
  userId?: string;
}

// Remove the old StreamChunk interface as we'll use the new StreamEvent types

const ChatInterface: React.FC<ChatInterfaceProps> = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [streamingMarkdown, setStreamingMarkdown] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showConversations, setShowConversations] = useState(false);
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);
  
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

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
    // Load persisted conversation ID from localStorage
    const persistedConversationId = localStorage.getItem('kronos-current-conversation-id');
    if (persistedConversationId) {
      setCurrentConversationId(persistedConversationId);
    }
  }, []);

  // Persist conversation ID to localStorage when it changes
  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem('kronos-current-conversation-id', currentConversationId);
    } else {
      localStorage.removeItem('kronos-current-conversation-id');
    }
  }, [currentConversationId]);

  const loadConversations = async () => {
    try {
      const response = await apiService.getConversations();
      setConversations(response.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const response = await apiService.getConversationMessages(conversationId);
      setMessages(response.messages || []);
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error('Failed to load conversation messages:', error);
      setError('Failed to load conversation');
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setCurrentConversationId('');
    setStreamingMessage('');
    setError(null);
    setShowConversations(false);
  };

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
      let sessionId = '';
      let isNewConversation = false;

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
                const parsed: StreamEvent = JSON.parse(data);
                
                switch (parsed.type) {
                  case StreamEventType.START:
                    conversationId = (parsed.data as any).conversationId || '';
                    sessionId = (parsed.data as any).sessionId || '';
                    isNewConversation = (parsed.data as any).isNewConversation || false;
                    setCurrentConversationId(conversationId);
                    console.log('Stream started:', { conversationId, sessionId, isNewConversation });
                    break;
                    
                  case StreamEventType.TOKEN:
                    assistantMessage += (parsed.data as any).token || '';
                    setStreamingMessage(assistantMessage);
                    break;
                    
                  case StreamEventType.MARKDOWN_TOKEN:
                    assistantMessage += (parsed.data as any).token || '';
                    setStreamingMarkdown(assistantMessage);
                    setIsMarkdownMode(true);
                    break;
                    
                    
                  case StreamEventType.END: {
                    // Finalize the assistant message
                    const finalMessage: ChatMessage = {
                      role: 'assistant',
                      content: assistantMessage,
                      timestamp: new Date().toISOString()
                    };
                    setMessages(prev => [...prev, finalMessage]);
                    setStreamingMessage('');
                    setIsStreaming(false);
                    console.log('Stream ended:', { 
                      conversationId, 
                      totalTokens: parsed.data.totalTokens,
                      processingTime: parsed.data.processingTime 
                    });
                    return;
                  }
                    
                  default:
                    console.warn('Unknown stream event type:', parsed.type);
                }
              } catch (parseError) {
                console.warn('Failed to parse stream event:', data, parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // If we reach here without an 'end' message, finalize anyway
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
    setStreamingMarkdown('');
    setIsMarkdownMode(false);
    setError(null);
    setShowConversations(false);
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
        <div className="chat-header-left">
          <button
            onClick={() => setShowConversations(!showConversations)}
            className="chat-control-btn"
            title="Conversations"
          >
            📋
          </button>
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
            onClick={startNewConversation}
            disabled={isStreaming}
            className="chat-control-btn"
            title="New conversation"
          >
            ➕
          </button>
          <button
            onClick={clearConversation}
            disabled={isStreaming}
            className="chat-control-btn clear"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Conversations Sidebar */}
      {showConversations && (
        <div className="conversations-sidebar">
          <div className="conversations-header">
            <h3>Conversations</h3>
            <button
              onClick={() => setShowConversations(false)}
              className="close-btn"
            >
              ✕
            </button>
          </div>
          <div className="conversations-list">
            <button
              onClick={startNewConversation}
              className={`conversation-item ${!currentConversationId ? 'active' : ''}`}
            >
              <div className="conversation-title">New Conversation</div>
              <div className="conversation-time">Start fresh</div>
            </button>
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => {
                  loadConversationMessages(conversation.id);
                  setShowConversations(false);
                }}
                className={`conversation-item ${currentConversationId === conversation.id ? 'active' : ''}`}
              >
                <div className="conversation-title">
                  {conversation.title || `Conversation ${conversation.id.slice(-8)}`}
                </div>
                <div className="conversation-time">
                  {new Date(conversation.updatedAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

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
                {message.role === 'assistant' ? (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code: ({ node, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match;
                        return !isInline && match ? (
                          <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        ) : (
                          <code className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                            {children}
                          </code>
                        );
                      },
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-2">
                          {children}
                        </blockquote>
                      ),
                      h1: ({ children }) => <h1 className="text-2xl font-bold mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-bold mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      a: ({ href, children }) => (
                        <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  message.content
                )}
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
        {isStreaming && (streamingMessage || streamingMarkdown) && (
          <div className="chat-message assistant">
            <div className="message-bubble assistant">
              <div className="whitespace-pre-wrap break-words">
                {isMarkdownMode ? (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code: ({ node, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match;
                        return !isInline && match ? (
                          <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        ) : (
                          <code className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                            {children}
                          </code>
                        );
                      },
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-2">
                          {children}
                        </blockquote>
                      ),
                      h1: ({ children }) => <h1 className="text-2xl font-bold mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-bold mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      a: ({ href, children }) => (
                        <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {streamingMarkdown || streamingMessage}
                  </ReactMarkdown>
                ) : (
                  streamingMessage
                )}
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
