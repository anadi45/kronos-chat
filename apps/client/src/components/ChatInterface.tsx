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
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const conversationsListRef = useRef<HTMLDivElement>(null);

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

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirmation) {
          cancelDeleteConversation();
        } else if (showConversations) {
          setShowConversations(false);
        }
      }
    };

    if (showConversations || showDeleteConfirmation) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
    
    return undefined;
  }, [showConversations, showDeleteConfirmation]);

  // Handle infinite scroll for conversations
  useEffect(() => {
    const handleScroll = () => {
      if (!conversationsListRef.current || !showConversations) return;
      
      const { scrollTop, scrollHeight, clientHeight } = conversationsListRef.current;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold
      
      if (isNearBottom && hasMoreConversations && !isLoadingConversations) {
        loadMoreConversations();
      }
    };

    const listElement = conversationsListRef.current;
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll);
      return () => listElement.removeEventListener('scroll', handleScroll);
    }
    
    return undefined;
  }, [showConversations, hasMoreConversations, isLoadingConversations, currentPage]);

  // Persist conversation ID to localStorage when it changes
  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem('kronos-current-conversation-id', currentConversationId);
    } else {
      localStorage.removeItem('kronos-current-conversation-id');
    }
  }, [currentConversationId]);


  const loadConversations = async (page: number = 1, append: boolean = false) => {
    if (isLoadingConversations) return;
    
    setIsLoadingConversations(true);
    try {
      const response = await apiService.getConversations(page, 10);
      
      if (append) {
        setConversations(prev => [...prev, ...response.items]);
      } else {
        setConversations(response.items || []);
      }
      setHasMoreConversations(page < response.totalPages);
      setCurrentPage(page);
      setError(null); // Clear any previous errors
    } catch (error: any) {
      console.error('Failed to load conversations:', error);
      
      // Handle different types of errors
      if (error.response?.status === 400) {
        setError(`Invalid request: ${error.response.data.message || 'Please check your parameters'}`);
      } else if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        setError('Network error. Please check your connection.');
      } else {
        setError('Failed to load conversations. Please try again.');
      }
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMoreConversations = async () => {
    if (hasMoreConversations && !isLoadingConversations) {
      await loadConversations(currentPage + 1, true);
    }
  };

  const showDeleteConfirmationModal = (conversation: Conversation, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the conversation load
    setConversationToDelete(conversation);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteConversation = async () => {
    if (!conversationToDelete) return;

    setIsDeletingConversation(true);
    try {
      const result = await apiService.deleteConversation(conversationToDelete.id);
      if (result.success) {
        // Remove from local state
        setConversations(prev => prev.filter(conv => conv.id !== conversationToDelete.id));
        
        // If this was the current conversation, clear it
        if (currentConversationId === conversationToDelete.id) {
          startNewConversation();
        }
        setError(null); // Clear any previous errors
      } else {
        setError(result.message || 'Failed to delete conversation');
      }
    } catch (error: any) {
      console.error('Failed to delete conversation:', error);
      
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
        setError('Failed to delete conversation. Please try again.');
      }
    } finally {
      setIsDeletingConversation(false);
      setShowDeleteConfirmation(false);
      setConversationToDelete(null);
    }
  };

  const cancelDeleteConversation = () => {
    setShowDeleteConfirmation(false);
    setConversationToDelete(null);
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const response = await apiService.getConversationMessages(conversationId);
      setMessages(response.messages || []);
      setCurrentConversationId(conversationId);
      setStreamingMessage('');
      setStreamingMarkdown('');
      setIsMarkdownMode(false);
      setError(null);
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
    setStreamingMessage('');
    setError(null);
    setShowConversations(false);
    // Reset pagination state
    setCurrentPage(1);
    setHasMoreConversations(true);
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
      // Create stream request - only message, no conversationId or history for new conversations
      const streamRequest: ChatRequest = {
        message: userMessage.content
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
      {/* Chat Header Section */}
      <div className="chat-header-section">
        <div className="chat-header">
          <div className="chat-header-left">
            <button
              onClick={() => setShowConversations(!showConversations)}
              className="chat-control-btn"
              title="Conversations"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
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
      </div>

      {/* Past Conversations Section */}
      {showConversations && (
        <div className="conversations-section">
          <div 
            className="conversations-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowConversations(false);
              }
            }}
          >
          <div className="conversations-modal">
            <div className="conversations-modal-header">
              <div className="conversations-header-content">
                <h3>Past Conversations</h3>
                <p className="conversations-subtitle">
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <button
                onClick={() => setShowConversations(false)}
                className="conversations-modal-close"
                aria-label="Close conversations"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="conversations-modal-content">
              <div className="conversations-list" ref={conversationsListRef}>
                {/* Conversations List */}
                {conversations.length === 0 && !isLoadingConversations ? (
                  <div className="conversations-empty">
                    <div className="conversations-empty-icon">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h4 className="conversations-empty-title">No conversations yet</h4>
                    <p className="conversations-empty-description">
                      Start chatting to see your conversation history here
                    </p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`conversation-item ${currentConversationId === conversation.id ? 'active' : ''}`}
                    >
                      <button
                        onClick={() => {
                          loadConversationMessages(conversation.id);
                          setShowConversations(false);
                        }}
                        className="conversation-content"
                      >
                        <div className="conversation-icon">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div className="conversation-details">
                          <div className="conversation-title">
                            {conversation.title || `Conversation ${conversation.id.slice(-8)}`}
                          </div>
                          <div className="conversation-time">
                            {new Date(conversation.updatedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={(e) => showDeleteConfirmationModal(conversation, e)}
                        className="conversation-delete-btn"
                        title="Delete conversation"
                        aria-label="Delete conversation"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
                
                {/* Loading indicator */}
                {isLoadingConversations && (
                  <div className="conversations-loading">
                    <div className="conversations-loading-spinner"></div>
                    <span>Loading more conversations...</span>
                  </div>
                )}
                
                {/* End of list indicator */}
                {!hasMoreConversations && conversations.length > 0 && (
                  <div className="conversations-end">
                    <div className="conversations-end-line"></div>
                    <span>You've reached the end</span>
                    <div className="conversations-end-line"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && conversationToDelete && (
        <div 
          className="delete-confirmation-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              cancelDeleteConversation();
            }
          }}
        >
          <div className="delete-confirmation-modal">
            <div className="delete-confirmation-header">
              <h3>Delete Conversation</h3>
            </div>
            <div className="delete-confirmation-content">
              <p>Are you sure you want to delete this conversation?</p>
              <div className="conversation-preview">
                <strong>{conversationToDelete.title || `Conversation ${conversationToDelete.id.slice(-8)}`}</strong>
                <span className="conversation-date">
                  {new Date(conversationToDelete.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="delete-confirmation-actions">
              <button
                onClick={cancelDeleteConversation}
                className="delete-confirmation-btn cancel"
                disabled={isDeletingConversation}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteConversation}
                className="delete-confirmation-btn delete"
                disabled={isDeletingConversation}
              >
                {isDeletingConversation ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="chat-messages">
        {messages.length === 0 && !streamingMessage && (
          <div className="chat-welcome">
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
            className={`chat-send-btn ${isStreaming ? 'streaming' : ''}`}
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
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
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
