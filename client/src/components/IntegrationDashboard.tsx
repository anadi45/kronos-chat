import React, { useState, useEffect, useCallback } from 'react';
import { 
  apiService, 
  IntegrationDashboard as IDashboard, 
  IntegrationSummary, 
  IntegrationActionRequest,
  IntegrationStats 
} from '../services/apiService';

interface IntegrationDashboardProps {
  userId?: string;
}

const IntegrationDashboard: React.FC<IntegrationDashboardProps> = ({ userId }) => {
  const [dashboard, setDashboard] = useState<IDashboard | null>(null);
  const [stats, setStats] = useState<IntegrationStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showConnectedOnly, setShowConnectedOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationSummary | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [dashboardData, statsData] = await Promise.all([
        apiService.getIntegrationDashboard(),
        apiService.getIntegrationStats()
      ]);
      
      setDashboard(dashboardData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load integration data');
      console.error('Failed to load integration data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (provider: string, action: string, connectionId?: string) => {
    try {
      setActionLoading(`${provider}-${action}`);
      setError(null);

      const actionRequest: IntegrationActionRequest = {
        provider,
        action,
        connection_id: connectionId,
        parameters: action === 'connect' ? { redirect_url: `${window.location.origin}/oauth/callback` } : undefined
      };

      const response = await apiService.performIntegrationAction(actionRequest);

      if (response.success) {
        if (response.redirect_url) {
          window.location.href = response.redirect_url;
        } else {
          await loadData(); // Refresh data
        }
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to ${action} ${provider}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getFilteredIntegrations = useCallback(() => {
    if (!dashboard) return [];

    let integrations = dashboard.integrations;

    // Filter by category
    if (selectedCategory !== 'all') {
      integrations = integrations.filter(i => 
        i.categories.some(c => c.toLowerCase() === selectedCategory.toLowerCase())
      );
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      integrations = integrations.filter(i =>
        i.display_name.toLowerCase().includes(search) ||
        i.provider.toLowerCase().includes(search) ||
        (i.description || '').toLowerCase().includes(search)
      );
    }

    // Filter by connection status
    if (showConnectedOnly) {
      integrations = integrations.filter(i => i.total_connections > 0);
    }

    return integrations;
  }, [dashboard, selectedCategory, searchTerm, showConnectedOnly]);

  const getStatusIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '⚪';
    }
  };

  const getStatusColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getHealthPercentage = () => {
    if (!dashboard || dashboard.total_connections === 0) return 100;
    return Math.round((dashboard.healthy_connections / dashboard.total_connections) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading integrations...</span>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">❌ Failed to load integration dashboard</div>
        {error && <div className="text-sm text-gray-600">{error}</div>}
        <button 
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const filteredIntegrations = getFilteredIntegrations();
  const healthPercentage = getHealthPercentage();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header & Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Integration Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage all your third-party integrations</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Last updated</div>
            <div className="text-sm font-medium">
              {new Date(dashboard.last_updated).toLocaleString()}
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className={`p-4 rounded-lg border mb-6 ${
          dashboard.composio_health 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">
                {dashboard.composio_health ? '✅' : '❌'}
              </span>
              <span className="font-medium">
                {dashboard.composio_health ? 'System Healthy' : 'System Issues Detected'}
              </span>
            </div>
            <div className="text-sm">
              {healthPercentage}% connections healthy
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{dashboard.total_integrations}</div>
            <div className="text-sm text-blue-700">Available Services</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{dashboard.connected_integrations}</div>
            <div className="text-sm text-green-700">Connected Services</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">{dashboard.total_connections}</div>
            <div className="text-sm text-purple-700">Total Connections</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">{dashboard.healthy_connections}</div>
            <div className="text-sm text-yellow-700">Healthy Connections</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search integrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            {dashboard.categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showConnectedOnly}
              onChange={(e) => setShowConnectedOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Connected only</span>
          </label>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Integrations Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredIntegrations.map((integration) => (
          <div
            key={integration.provider}
            className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow"
          >
            {/* Integration Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={integration.logo_url || '/default-app-icon.png'}
                    alt={integration.display_name}
                    className="w-12 h-12 rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = '/default-app-icon.png';
                    }}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {integration.display_name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(integration.health)}`}>
                        {getStatusIcon(integration.health)} {integration.health}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {integration.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {integration.description}
                </p>
              )}

              {/* Categories */}
              <div className="flex flex-wrap gap-1 mb-4">
                {integration.categories.slice(0, 3).map(category => (
                  <span
                    key={category}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    {category}
                  </span>
                ))}
                {integration.categories.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    +{integration.categories.length - 3}
                  </span>
                )}
              </div>

              {/* Connection Stats */}
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {integration.total_connections}
                  </div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-600">
                    {integration.active_connections}
                  </div>
                  <div className="text-xs text-gray-500">Active</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-red-600">
                    {integration.error_connections}
                  </div>
                  <div className="text-xs text-gray-500">Errors</div>
                </div>
              </div>

              {/* Health Message */}
              {integration.health_message && (
                <div className="text-xs text-gray-600 mb-4">
                  {integration.health_message}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t p-4">
              {integration.total_connections === 0 ? (
                <button
                  onClick={() => handleAction(integration.provider, 'connect')}
                  disabled={actionLoading === `${integration.provider}-connect`}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {actionLoading === `${integration.provider}-connect` ? (
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  Connect
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedIntegration(integration)}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Manage Connections ({integration.total_connections})
                  </button>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAction(integration.provider, 'connect')}
                      disabled={actionLoading === `${integration.provider}-connect`}
                      className="flex-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 disabled:opacity-50"
                    >
                      + Add
                    </button>
                    <button
                      onClick={() => handleAction(integration.provider, 'refresh', integration.connections[0]?.account_id)}
                      disabled={actionLoading === `${integration.provider}-refresh`}
                      className="flex-1 px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 disabled:opacity-50"
                    >
                      🔄 Refresh
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredIntegrations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No integrations found</div>
          <div className="text-gray-500 text-sm">
            Try adjusting your search or filters
          </div>
        </div>
      )}

      {/* Connection Details Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">
                  {selectedIntegration.display_name} Connections
                </h3>
                <button
                  onClick={() => setSelectedIntegration(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                {selectedIntegration.connections.map((connection) => (
                  <div key={connection.account_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Connection {connection.account_id.slice(-8)}</div>
                      <div className="text-sm text-gray-500">
                        Created: {connection.created_at ? new Date(connection.created_at).toLocaleDateString() : 'Unknown'}
                      </div>
                      {connection.error_message && (
                        <div className="text-sm text-red-600 mt-1">{connection.error_message}</div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(connection.status === 'active' ? 'healthy' : 'error')}`}>
                        {connection.status}
                      </span>
                      <button
                        onClick={() => handleAction(selectedIntegration.provider, 'disconnect', connection.account_id)}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationDashboard;
