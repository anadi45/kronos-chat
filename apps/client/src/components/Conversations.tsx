import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import type { Conversation } from '@quark/core';

interface ConversationsProps {
    userId?: string;
}

const Conversations: React.FC<ConversationsProps> = () => {
    const navigate = useNavigate();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);
    const [hasMoreConversations, setHasMoreConversations] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalConversations, setTotalConversations] = useState(0);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
    const [isDeletingConversation, setIsDeletingConversation] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const conversationsListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadConversations();
    }, []);

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

            setTotalConversations(response.total);
            setHasMoreConversations(page < response.totalPages);
            setCurrentPage(page);
            setError(null);
        } catch (error: any) {
            console.error('Failed to load conversations:', error);

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
        event.stopPropagation();
        setConversationToDelete(conversation);
        setShowDeleteConfirmation(true);
    };

    const confirmDeleteConversation = async () => {
        if (!conversationToDelete) return;

        setIsDeletingConversation(true);
        try {
            await apiService.deleteConversation(conversationToDelete.id);

            // Remove from local state
            setConversations(prev => prev.filter(c => c.id !== conversationToDelete.id));
            setTotalConversations(prev => prev - 1);

            setShowDeleteConfirmation(false);
            setConversationToDelete(null);
        } catch (error: any) {
            console.error('Failed to delete conversation:', error);
            setError('Failed to delete conversation. Please try again.');
        } finally {
            setIsDeletingConversation(false);
        }
    };

    const cancelDeleteConversation = () => {
        setShowDeleteConfirmation(false);
        setConversationToDelete(null);
    };

    const handleConversationClick = (conversationId: string) => {
        navigate(`/chat/${conversationId}`);
    };

    const handleNewConversation = () => {
        navigate('/chat');
    };

    return (
        <div className="conversations-page">
            {/* Header */}
            <div className="conversations-header">
                <div className="conversations-header-content">
                    <h1>Past Conversations</h1>
                    <p className="conversations-subtitle">
                        {totalConversations === 0
                            ? '0 Conversations found'
                            : `${conversations.length} of ${totalConversations} conversation${totalConversations !== 1 ? 's' : ''} loaded`
                        }
                    </p>
                </div>
                <button
                    onClick={handleNewConversation}
                    className="new-conversation-btn"
                    title="Start new conversation"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Chat
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="conversations-error">
                    <div className="error-content">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                        <button
                            onClick={() => {
                                setError(null);
                                loadConversations();
                            }}
                            className="error-retry-btn"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            )}

            {/* Conversations List */}
            <div className="conversations-content">
                <div className="conversations-list" ref={conversationsListRef}>
                    {conversations.length === 0 && !isLoadingConversations ? (
                        <div className="conversations-empty">
                            <div className="conversations-empty-icon">
                                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h4 className="conversations-empty-title">No conversations yet</h4>
                            <p className="conversations-empty-description">
                                Start chatting to see your conversation history here
                            </p>
                            <button
                                onClick={handleNewConversation}
                                className="conversations-empty-btn"
                            >
                                Start New Conversation
                            </button>
                        </div>
                    ) : (
                        conversations.map((conversation) => (
                            <div
                                key={conversation.id}
                                className="conversation-item"
                            >
                                <button
                                    onClick={() => handleConversationClick(conversation.id)}
                                    className="conversation-content"
                                >
                                    <div className="conversation-icon">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <div className="conversation-details">
                                        <div className="conversation-title">
                                            {conversation.title || 'Untitled Conversation'}
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

                    {/* Load more button */}
                    {hasMoreConversations && conversations.length > 0 && (
                        <div className="conversations-load-more">
                            <button
                                onClick={loadMoreConversations}
                                disabled={isLoadingConversations}
                                className="load-more-btn"
                            >
                                {isLoadingConversations ? 'Loading...' : 'Load More'}
                            </button>
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
        </div>
    );
};

export default Conversations;
