import React, { useState, useEffect, useCallback } from 'react';
import { composioService, type ProviderName } from '../services/composioService';
import { COMPOSIO_CONFIG } from '../config/composio';

interface Connection {
  id: string;
  status: string;
  provider: string;
  createdAt: string;
}

const OAuthIntegrationManager: React.FC = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userId] = useState<string>('user123'); // In a real app, this would come from auth context
  const [selectedProvider, setSelectedProvider] = useState<ProviderName>('github');

  // Load connections on component mount
  const loadConnections = useCallback(async () => {
    try {
      setLoading(true);
      const accounts = await composioService.listConnectedAccounts(userId);
      setConnections(accounts.map((account) => ({
        id: account.id,
        status: account.status,
        provider: account.provider,
        createdAt: account.createdAt,
      })));
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleConnect = async (provider: ProviderName) => {
    try {
      setLoading(true);
      
      // Initiate the connection
      const connectionResponse = await composioService.initiateConnection(
        userId,
        provider,
        {
          callbackUrl: `${window.location.origin}/oauth/callback`,
          // Add scopes as needed for each provider
          scope: getProviderScopes(provider),
        }
      );
      
      // Redirect user to the OAuth provider
      window.location.href = connectionResponse.redirectUrl;
    } catch (error) {
      console.error(`Failed to connect to ${provider}:`, error);
      alert(`Failed to connect to ${provider}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const getProviderScopes = (provider: ProviderName): string[] => {
    // Define scopes for each provider
    const scopes: Record<ProviderName, string[]> = {
      github: ['repo', 'user', 'gist'],
      slack: ['channels:read', 'chat:write', 'users:read'],
      notion: ['read', 'write'],
      gmail: ['https://www.googleapis.com/auth/gmail.readonly'],
      google_calendar: ['https://www.googleapis.com/auth/calendar'],
      twitter: ['tweet.read', 'users.read'],
      discord: ['identify', 'guilds'],
    };
    
    return scopes[provider] || [];
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      setLoading(true);
      await composioService.deleteConnectedAccount(accountId);
      await loadConnections(); // Refresh the list
    } catch (error) {
      console.error('Failed to disconnect account:', error);
      alert('Failed to disconnect account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (accountId: string) => {
    try {
      setLoading(true);
      await composioService.refreshConnectedAccount(accountId);
      await loadConnections(); // Refresh the list
      alert('Connection refreshed successfully!');
    } catch (error) {
      console.error('Failed to refresh account:', error);
      alert('Failed to refresh connection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">OAuth Integrations</h2>
        
        {/* Connection Form */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Connect New Service</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as ProviderName)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {Object.entries(COMPOSIO_CONFIG.PROVIDERS).map(([key, provider]) => (
                <option key={provider} value={provider}>
                  {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleConnect(selectedProvider)}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </div>

        {/* Connections List */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-4">Connected Accounts</h3>
          
          {loading && connections.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Loading connections...</p>
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No connections</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by connecting a service.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connections.map((connection) => (
                <div key={connection.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900 capitalize">
                        {connection.provider.replace('_', ' ')}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Connected on {new Date(connection.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(connection.status)}`}>
                      {connection.status}
                    </span>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => handleRefresh(connection.id)}
                      disabled={loading}
                      className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                    >
                      Refresh
                    </button>
                    <button
                      onClick={() => handleDisconnect(connection.id)}
                      disabled={loading}
                      className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthIntegrationManager;