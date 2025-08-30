import React, { useState, useEffect, useCallback } from 'react';
import { apiService, type ConnectedAccount, type AuthConfig, type Toolkit, type EnhancedConnectionRequest } from '../services/apiService';
import AuthConfigManager from './AuthConfigManager';

interface EnhancedOAuthManagerProps {
  userId?: string;
}

const EnhancedOAuthManager: React.FC<EnhancedOAuthManagerProps> = ({ 
  userId = 'user123' // Default for demo, in real app this would come from auth context
}) => {
  const [connections, setConnections] = useState<ConnectedAccount[]>([]);
  const [toolkits, setToolkits] = useState<Toolkit[]>([]);
  const [selectedAuthConfig, setSelectedAuthConfig] = useState<AuthConfig | null>(null);
  const [selectedToolkit, setSelectedToolkit] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthConfigManager, setShowAuthConfigManager] = useState(false);
  const [composioHealth, setComposioHealth] = useState<{ configured: boolean; message: string } | null>(null);

  // Load connections on component mount
  const loadConnections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const accounts = await apiService.listConnections(userId);
      setConnections(accounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connections');
      console.error('Failed to load connections:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load available toolkits
  const loadToolkits = useCallback(async () => {
    try {
      const toolkitList = await apiService.getAvailableToolkits({ limit: 50 });
      setToolkits(toolkitList);
    } catch (err) {
      console.error('Failed to load toolkits:', err);
    }
  }, []);

  // Check Composio health
  const checkHealth = useCallback(async () => {
    try {
      const health = await apiService.checkComposioHealth();
      setComposioHealth(health);
    } catch (err) {
      console.error('Failed to check health:', err);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    loadConnections();
    loadToolkits();
  }, [checkHealth, loadConnections, loadToolkits]);

  const handleConnect = async () => {
    if (!selectedToolkit) {
      setError('Please select a toolkit to connect');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const connectionRequest: EnhancedConnectionRequest = {
        user_id: userId,
        app_name: selectedToolkit,
        redirect_url: `${window.location.origin}/oauth/callback`,
      };

      // Add auth config if selected
      if (selectedAuthConfig) {
        connectionRequest.auth_config_id = selectedAuthConfig.id;
      }

      // Initiate the enhanced connection
      const connectionResponse = await apiService.initiateEnhancedConnection(connectionRequest);
      
      // Redirect to OAuth provider
      if (connectionResponse.redirect_url) {
        window.location.href = connectionResponse.redirect_url;
      } else {
        setError('No redirect URL received from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate connection');
      console.error('Failed to connect:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await apiService.deleteConnection(accountId);
      await loadConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect account');
      console.error('Failed to disconnect:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (accountId: string) => {
    try {
      setLoading(true);
      setError(null);
      await apiService.refreshConnection(accountId);
      await loadConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh connection');
      console.error('Failed to refresh:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableDisable = async (accountId: string, currentStatus: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (currentStatus.toLowerCase() === 'active') {
        await apiService.disableConnection(accountId);
      } else {
        await apiService.enableConnection(accountId);
      }
      
      await loadConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update connection status');
      console.error('Failed to enable/disable:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'enabled':
        return 'text-green-600 bg-green-100';
      case 'disabled':
      case 'inactive':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getProviderLogo = (provider: string) => {
    const toolkit = toolkits.find(t => t.slug === provider);
    return toolkit?.logo || '/default-app-icon.png';
  };

  if (showAuthConfigManager) {
    return (
      <div>
        <div className="mb-4">
          <button
            onClick={() => setShowAuthConfigManager(false)}
            className="px-4 py-2 text-blue-600 hover:text-blue-800"
          >
            ← Back to Connections
          </button>
        </div>
        <AuthConfigManager
          userId={userId}
          onAuthConfigSelect={(config) => {
            setSelectedAuthConfig(config);
            setShowAuthConfigManager(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">OAuth Integration Manager</h2>
        
        {/* Health Status */}
        {composioHealth && (
          <div className={`mb-4 p-3 rounded-md ${
            composioHealth.configured 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <div className="font-medium">
              {composioHealth.configured ? '✅ Composio Ready' : '❌ Composio Not Configured'}
            </div>
            <div className="text-sm">{composioHealth.message}</div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Connection Form */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">Connect New Service</h3>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Toolkit
              </label>
              <select
                value={selectedToolkit}
                onChange={(e) => setSelectedToolkit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Choose a service...</option>
                {toolkits.map((toolkit) => (
                  <option key={toolkit.slug} value={toolkit.slug}>
                    {toolkit.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auth Configuration (Optional)
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  {selectedAuthConfig ? (
                    <div className="px-3 py-2 bg-blue-100 text-blue-800 rounded-md text-sm">
                      {selectedAuthConfig.name}
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md text-sm">
                      Using default config
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowAuthConfigManager(true)}
                  className="px-3 py-2 text-blue-600 hover:text-blue-800 text-sm border border-blue-300 rounded-md"
                >
                  Manage
                </button>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleConnect}
                disabled={loading || !selectedToolkit}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Connected Accounts</h3>
        
        {loading && connections.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-600">Loading connections...</div>
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-600">No connected accounts found.</div>
            <div className="text-sm text-gray-500 mt-2">Connect to a service above to get started.</div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {connections.map((connection) => (
              <div
                key={connection.account_id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-3">
                  <img
                    src={getProviderLogo(connection.provider)}
                    alt={connection.provider}
                    className="w-8 h-8 rounded mr-3"
                    onError={(e) => {
                      e.currentTarget.src = '/default-app-icon.png';
                    }}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 capitalize">
                      {connection.provider.replace('_', ' ')}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Connected {connection.created_at ? new Date(connection.created_at).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(connection.status)}`}>
                    {connection.status}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEnableDisable(connection.account_id, connection.status)}
                    disabled={loading}
                    className={`flex-1 px-3 py-2 text-sm rounded ${
                      connection.status.toLowerCase() === 'active'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    } disabled:opacity-50`}
                  >
                    {connection.status.toLowerCase() === 'active' ? 'Disable' : 'Enable'}
                  </button>
                  
                  <button
                    onClick={() => handleRefresh(connection.account_id)}
                    disabled={loading}
                    className="px-3 py-2 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 disabled:opacity-50"
                  >
                    Refresh
                  </button>
                  
                  <button
                    onClick={() => handleDisconnect(connection.account_id)}
                    disabled={loading}
                    className="px-3 py-2 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedOAuthManager;
