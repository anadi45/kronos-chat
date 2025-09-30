import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import type {
  ChatMessage,
  ChatRequest,
  Provider
} from '@quark/core';
import { StreamEvent, StreamEventType } from '@quark/core';
import IntegrationSelector from './IntegrationSelector';

interface ChatInterfaceProps {
  userId?: string;
}

// Remove the old StreamChunk interface as we'll use the new StreamEvent types

const ChatInterface: React.FC<ChatInterfaceProps> = () => {
  const { conversationId: urlConversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string>('');
  const [conversationTitle, setConversationTitle] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [streamingMarkdown, setStreamingMarkdown] = useState('');
  const [progressUpdate, setProgressUpdate] = useState<string | null>(null);
  const [selectedToolkits, setSelectedToolkits] = useState<Provider[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate a title from the first message
  const generateTitleFromMessage = (message: string): string => {
    // Take first 50 characters and clean up
    const title = message.trim().substring(0, 50);
    return title.length < message.trim().length ? `${title}...` : title;
  };

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

  // Handle URL-based conversation loading
  useEffect(() => {
    if (urlConversationId && urlConversationId !== currentConversationId) {
      // Load conversation from URL parameter
      loadConversationMessages(urlConversationId);
    }
    // Remove the automatic redirect to conversation ID - let /chat stay as /chat for new conversations
  }, [urlConversationId, currentConversationId, navigate]);

  // Load persisted conversation ID from localStorage on component mount (fallback)
  // Only load from localStorage if we're not on the base /chat route
  useEffect(() => {
    if (!urlConversationId) {
      // Don't automatically load conversation from localStorage on /chat
      // Let users start fresh conversations on /chat
      setCurrentConversationId('');
      setConversationTitle('');
    }
  }, [urlConversationId]);


  // Persist conversation ID to localStorage when it changes
  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem('kronos-current-conversation-id', currentConversationId);
    } else {
      localStorage.removeItem('kronos-current-conversation-id');
    }
  }, [currentConversationId]);


  const loadConversationMessages = async (conversationId: string) => {
    try {
      const response = await apiService.getConversationMessages(conversationId);
      setMessages(response.messages || []);
      setCurrentConversationId(conversationId);
      setStreamingMessage('');
      setStreamingMarkdown('');
      setError(null);

      // Update URL if not already there
      if (urlConversationId !== conversationId) {
        navigate(`/chat/${conversationId}`, { replace: true });
      }

      // Set conversation title from the conversation data
      setConversationTitle('Untitled Conversation');
    } catch (error: any) {
      console.error('Failed to load conversation messages:', error);

      // Handle different types of errors
      if (error.response?.status === 400) {
        setError(`Invalid request: ${error.response.data.message || 'Please check your parameters'}`);
      } else if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 404) {
        setError('Conversation not found.');
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        setError('Network error. Please check your connection.');
      } else {
        setError('Failed to load conversation. Please try again.');
      }
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setCurrentConversationId('');
    setConversationTitle('');
    setStreamingMessage('');
    setError(null);
    // Navigate to base chat URL
    navigate('/chat', { replace: true });
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setStreamingMessage('');
    setStreamingMarkdown('');
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    // Clear any previous streaming state before adding user message
    setStreamingMessage('');
    setStreamingMarkdown('');
    setProgressUpdate(null);
    setError(null);
    setIsStreaming(true);

    // Add user message to the conversation
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Generate title from first message if this is a new conversation
    if (!currentConversationId && messages.length === 0) {
      const generatedTitle = generateTitleFromMessage(userMessage.content);
      setConversationTitle(generatedTitle);
    }

    try {
      // Create stream request - only message, no conversationId or history for new conversations
      const streamRequest: ChatRequest = {
        message: userMessage.content,
        toolkits: selectedToolkits.length > 0 ? selectedToolkits : []
      };

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      // Get readable stream - only pass conversationId if it's an existing conversation
      const stream = await apiService.sendChatMessage(streamRequest, currentConversationId && currentConversationId.trim() !== '' ? currentConversationId : undefined);
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

                    // Update URL with new conversation ID
                    if (conversationId && urlConversationId !== conversationId) {
                      navigate(`/chat/${conversationId}`, { replace: true });
                    }

                    console.log('Stream started:', { conversationId, sessionId, isNewConversation });
                    break;

                  case StreamEventType.TOKEN:
                    assistantMessage += (parsed.data as any).token || '';
                    setStreamingMessage(assistantMessage);
                    setStreamingMarkdown(assistantMessage);
                    break;

                  case StreamEventType.PROGRESS_UPDATE:
                    setProgressUpdate((parsed.data as any).message || '');
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
                    setProgressUpdate(null);
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



  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="chat-container">
      {/* Chat Header Section */}
      <div className="chat-header-section">
        <div className="chat-header">
          <div className="chat-header-left">
            <p className="text-sm text-gray-300">
              {currentConversationId
                ? (conversationTitle || 'Untitled Conversation')
                : (conversationTitle || 'New conversation')
              }
            </p>
          </div>
        </div>
      </div>


      {/* Messages Area */}
      <div className="chat-messages">

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

        {/* Progress Update */}
        {isStreaming && progressUpdate && (
          <div className="chat-message assistant">
            <div className="chat-loading">
              <div className="chat-loading-dots">
                <div className="chat-loading-dot"></div>
                <div className="chat-loading-dot"></div>
                <div className="chat-loading-dot"></div>
              </div>
              <span className="text-sm text-gray-300">{progressUpdate}</span>
            </div>
          </div>
        )}

        {/* Streaming Message */}
        {isStreaming && (streamingMessage || streamingMarkdown) && (
          <div className="chat-message assistant">
            <div className="message-bubble assistant">
              <div className="whitespace-pre-wrap break-words">
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
                <span className="chat-streaming-cursor"></span>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isStreaming && !streamingMessage && !progressUpdate && (
          <div className="chat-message assistant">
            <div className="chat-loading">
              <div className="chat-loading-dots">
                <div className="chat-loading-dot"></div>
                <div className="chat-loading-dot"></div>
                <div className="chat-loading-dot"></div>
              </div>
              <span className="text-sm text-gray-300">Quark is thinking...</span>
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
          <div className="chat-integration-selector">
            <IntegrationSelector
              selectedToolkits={selectedToolkits}
              onToolkitsChange={setSelectedToolkits}
            />
          </div>

          <div className="chat-input-main">
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
              onClick={isStreaming ? handleStopStreaming : handleSendMessage}
              disabled={!input.trim() && !isStreaming}
              className={`chat-send-btn ${isStreaming ? 'streaming' : ''}`}
            >
              {isStreaming ? (
                <img
                  src="/images/integrations/stop.png"
                  alt="Stop"
                  className="h-5 w-5"
                  style={{ objectFit: 'contain' }}
                />
              ) : (
                <img
                  src="/images/integrations/send.png"
                  alt="Send"
                  className="h-4 w-4"
                  style={{ objectFit: 'contain' }}
                />
              )}
            </button>
          </div>
        </div>

        <div className="chat-disclaimer">
          Quark AI can make mistakes. Consider checking important information.
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
