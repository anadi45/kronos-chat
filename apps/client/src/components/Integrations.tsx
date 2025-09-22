import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import type { Integration } from '@kronos/core';

interface IntegrationIconProps {
  integrationId: string;
  className?: string;
}

const IntegrationIcon: React.FC<IntegrationIconProps> = ({
  integrationId,
  className = 'w-8 h-8',
}) => {
  // https://icon-icons.com/
  const getImageSrc = (id: string) => {
    return `/images/integrations/${id.toLowerCase()}.png`;
  };

  return (
    <div className="integration-icon-wrapper">
      <img
        src={getImageSrc(integrationId)}
        alt={`${integrationId} icon`}
        className={className}
        style={{ objectFit: 'contain' }}
        onError={(e) => {
          // Fallback to a default icon if image fails to load
          e.currentTarget.src = '/images/integrations/default.svg';
        }}
      />
    </div>
  );
};

interface IntegrationCardProps {
  integration: Integration;
  onConnect: (provider: string) => Promise<void>;
  onShowDisconnectModal: (provider: string) => void;
  isConnecting: boolean;
  isDisconnecting: boolean;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onConnect,
  onShowDisconnectModal,
  isConnecting,
  isDisconnecting,
}) => {
  const getStatusBadge = () => {
    if (integration.isConnected) {
      return (
        <button className="btn btn-connected" disabled>
          Connected
        </button>
      );
    }

    // Handle integrations that don't need authentication
    if (integration.authType === 'not_needed') {
      return (
        <button className="btn btn-connected" disabled>
          Ready to Use
        </button>
      );
    }

    switch (integration.status) {
      case 'available':
        return (
          <button className="btn btn-available" disabled>
            Available
          </button>
        );
      case 'coming_soon':
        return (
          <button className="btn btn-coming-soon" disabled>
            Coming Soon
          </button>
        );
      case 'beta':
        return (
          <button className="btn btn-beta" disabled>
            Beta
          </button>
        );
      default:
        return (
          <button className="btn btn-coming-soon" disabled>
            Coming Soon
          </button>
        );
    }
  };

  const getActionButton = () => {
    if (integration.status === 'coming_soon' || integration.status === 'beta') {
      return (
        <button className="btn btn-integration" disabled>
          Coming Soon
        </button>
      );
    }

    // Handle integrations that don't need authentication
    if (integration.authType === 'not_needed') {
      return (
        <button className="btn btn-integration" disabled>
          No Setup Required
        </button>
      );
    }

    if (integration.isConnected) {
      return (
        <button
          className="btn btn-danger"
          onClick={() => onShowDisconnectModal(integration.id)}
          disabled={isDisconnecting}
        >
          {isDisconnecting ? (
            <>
              <svg
                className="animate-spin w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Disconnecting...
            </>
          ) : (
            'Disconnect'
          )}
        </button>
      );
    }

    return (
      <button
        className="btn btn-integration"
        onClick={() => onConnect(integration.id)}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <svg
              className="animate-spin w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Connecting...
          </>
        ) : (
          'Connect'
        )}
      </button>
    );
  };

  return (
    <div
      className={`integration-card ${
        integration.isConnected ? 'connected' : ''
      }`}
    >
      <div className="integration-header">
        <IntegrationIcon integrationId={integration.id} className="w-8 h-8" />
        <h3 className="integration-title">{integration.name}</h3>
      </div>
      <p className="integration-description">{integration.description}</p>
      <div className="integration-status">
        {getStatusBadge()}
        {getActionButton()}
      </div>
      {integration.isConnected && (
        <div className="integration-connected-info">
          {integration.authType === 'not_needed' ? (
            <p>This integration is always available and requires no setup</p>
          ) : integration.connectedAt ? (
            <p>
              Connected on{' '}
              {new Date(integration.connectedAt).toLocaleDateString()} at{' '}
              {new Date(integration.connectedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
};

const Integrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(
    null
  );
  const [disconnectingProvider, setDisconnectingProvider] = useState<
    string | null
  >(null);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [providerToDisconnect, setProviderToDisconnect] = useState<
    string | null
  >(null);

  useEffect(() => {
    loadIntegrations();
    handleOAuthCallback();
  }, []);

  // Focus modal when it opens
  useEffect(() => {
    if (showDisconnectModal) {
      const modal = document.querySelector('.modal-content');
      if (modal) {
        (modal as HTMLElement).focus();
      }
    }
  }, [showDisconnectModal]);

  const handleOAuthCallback = () => {
    // Check if we're returning from an OAuth flow
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    if (error) {
      const errorMessage = errorDescription || error;
      setError(`OAuth authentication failed: ${errorMessage}`);
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code && state) {
      // OAuth callback received - the connection should be established
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);

      // Show success message and refresh integrations
      setError(null);
      setSuccess(`Successfully connected to ${state}!`);

      // Load integrations to reflect the new connection
      loadIntegrations();

      // Clean up stored connection ID
      const provider = state.toLowerCase();
      localStorage.removeItem(`oauth_connection_${provider}`);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    }
  };

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Single API call that returns all integrations with connection status
      const integrations = await apiService.getAvailableIntegrations();
      setIntegrations(integrations);
    } catch (error) {
      console.error('Error loading integrations:', error);
      setError('Failed to load integrations. Please try again.');
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: string) => {
    try {
      setConnectingProvider(provider);
      setError(null);
      setSuccess(null);

      const result = await apiService.connectIntegration(provider);

      if (result.success) {
        // If there's an auth URL, open it in a new tab for OAuth flow
        if (result.authUrl) {
          // Store the connection ID for later verification
          if (result.connectionId) {
            localStorage.setItem(
              `oauth_connection_${provider}`,
              result.connectionId
            );
          }
          window.open(result.authUrl, '_blank');
        } else {
          // Refresh integrations if no redirect needed
          await loadIntegrations();
        }
      } else {
        setError(result.message || 'Failed to connect integration');
      }
    } catch (error: any) {
      console.error('Error connecting integration:', error);
      setError(
        error.message || 'Failed to connect integration. Please try again.'
      );
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleShowDisconnectModal = (provider: string) => {
    setProviderToDisconnect(provider);
    setShowDisconnectModal(true);
  };

  const handleConfirmDisconnect = async () => {
    if (!providerToDisconnect) return;

    try {
      setDisconnectingProvider(providerToDisconnect);
      setError(null);
      setSuccess(null);
      setShowDisconnectModal(false);

      // Use the updated disconnect method that follows Composio auth-configs delete API pattern
      const result = await apiService.disconnectIntegration(
        providerToDisconnect
      );

      if (result.success) {
        setSuccess(
          `${providerToDisconnect} has been successfully disconnected. Your AI assistant will no longer have access to this integration.`
        );
        // Refresh integrations to reflect the disconnection
        await loadIntegrations();

        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(
          result.message ||
            `Unable to disconnect from ${providerToDisconnect}. Please try again or contact support if the issue persists.`
        );
      }
    } catch (error: any) {
      console.error('Error disconnecting integration:', error);
      setError(
        error.message ||
          `Unable to disconnect from ${providerToDisconnect}. This might be due to a network issue or server problem. Please try again in a moment.`
      );
    } finally {
      setDisconnectingProvider(null);
      setProviderToDisconnect(null);
    }
  };

  const handleCancelDisconnect = () => {
    setShowDisconnectModal(false);
    setProviderToDisconnect(null);
  };

  // Handle keyboard navigation for modal
  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !disconnectingProvider) {
      handleCancelDisconnect();
    }
  };

  // Handle Enter key on disconnect button
  const handleDisconnectKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disconnectingProvider) {
      handleConfirmDisconnect();
    }
  };

  if (loading) {
    return (
      <div className="integrations-page">
        <div className="page-header">
          <p className="text-gray-300">
            Connect Kronos with your favorite tools and services
          </p>
        </div>
        <div className="page-content">
          <div className="integrations-loader">
            <div className="integrations-loader-spinner"></div>
            <div className="integrations-loader-text">
              Loading integrations...
            </div>
            <div className="integrations-loader-subtext">
              Fetching available services and connection status
            </div>
          </div>

          <div className="skeleton-grid">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="skeleton-card">
                <div className="skeleton-icon"></div>
                <div className="skeleton-title"></div>
                <div className="skeleton-description"></div>
                <div className="skeleton-description"></div>
                <div className="skeleton-status">
                  <div className="skeleton-badge"></div>
                  <div className="skeleton-button"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="integrations-page">
      <div className="page-header">
        <p className="text-gray-300">
          Connect Kronos with your favorite tools and services
        </p>
      </div>

      <div className="page-content">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-300 hover:text-red-200"
            >
              Dismiss
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400">{success}</p>
            <button
              onClick={() => setSuccess(null)}
              className="mt-2 text-sm text-green-300 hover:text-green-200"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="integrations-grid">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onConnect={handleConnect}
              onShowDisconnectModal={handleShowDisconnectModal}
              isConnecting={connectingProvider === integration.id}
              isDisconnecting={disconnectingProvider === integration.id}
            />
          ))}
        </div>

        <div className="integrations-info">
          <div className="info-card">
            <h3 className="text-lg font-semibold text-white mb-3">
              About Integrations
            </h3>
            <p className="text-gray-300 mb-4">
              Kronos integrations allow you to connect with your favorite tools
              and services, making your AI assistant available wherever you
              work.
            </p>
            <div className="feature-list">
              <div className="feature-item">
                <svg
                  className="w-5 h-5 text-green-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Seamless connectivity</span>
              </div>
              <div className="feature-item">
                <svg
                  className="w-5 h-5 text-green-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Real-time data</span>
              </div>
              <div className="feature-item">
                <svg
                  className="w-5 h-5 text-green-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Secure authentication</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !disconnectingProvider) {
              handleCancelDisconnect();
            }
          }}
        >
          <div
            className="modal-content"
            onKeyDown={handleModalKeyDown}
            role="dialog"
            aria-labelledby="disconnect-modal-title"
            aria-describedby="disconnect-modal-description"
            tabIndex={-1}
          >
            <div className="modal-header">
              <h3 id="disconnect-modal-title" className="modal-title">
                Confirm Disconnection
              </h3>
              <button
                className="modal-close"
                onClick={handleCancelDisconnect}
                disabled={disconnectingProvider !== null}
                aria-label="Close disconnect confirmation"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div id="disconnect-modal-description" className="modal-body">
              {/* Integration Icon and Header */}
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mr-4 border border-red-500/20"></div>
                <div>
                  <h4 className="text-xl font-semibold text-white mb-1">
                    Disconnect {providerToDisconnect}?
                  </h4>
                  <p className="text-gray-300 text-sm">
                    This will remove your {providerToDisconnect} integration and
                    revoke access. This action cannot be undone. You will need
                    to reconnect your {providerToDisconnect} account to use it
                    again.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={handleCancelDisconnect}
                disabled={disconnectingProvider !== null}
                aria-label="Cancel disconnection"
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmDisconnect}
                onKeyDown={handleDisconnectKeyDown}
                disabled={disconnectingProvider !== null}
                aria-label={
                  disconnectingProvider
                    ? `Disconnecting from ${providerToDisconnect}...`
                    : `Disconnect from ${providerToDisconnect}`
                }
                autoFocus
              >
                {disconnectingProvider ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Disconnecting...
                  </>
                ) : (
                  'Disconnect'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;
