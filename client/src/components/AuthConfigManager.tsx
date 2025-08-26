import React, { useState, useEffect } from 'react';
import { apiService, type AuthConfig, type Toolkit, type AuthConfigRequest } from '../services/apiService';

interface AuthConfigManagerProps {
  userId: string;
  onAuthConfigSelect?: (authConfig: AuthConfig) => void;
}

const AuthConfigManager: React.FC<AuthConfigManagerProps> = ({ userId: _, onAuthConfigSelect }) => {
  const [authConfigs, setAuthConfigs] = useState<AuthConfig[]>([]);
  const [toolkits, setToolkits] = useState<Toolkit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState('');
  
  // Form state for creating new auth config
  const [newConfig, setNewConfig] = useState<AuthConfigRequest>({
    name: '',
    toolkit_slug: '',
    auth_scheme: 'OAUTH2'
  });

  useEffect(() => {
    loadAuthConfigs();
    loadToolkits();
  }, []);

  const loadAuthConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.listAuthConfigs({
        search: search || undefined,
        limit: 50
      });
      setAuthConfigs(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auth configs');
      console.error('Error loading auth configs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadToolkits = async () => {
    try {
      const toolkitList = await apiService.getAvailableToolkits({ limit: 100 });
      setToolkits(toolkitList);
    } catch (err) {
      console.error('Error loading toolkits:', err);
    }
  };

  const handleCreateConfig = async () => {
    if (!newConfig.name || !newConfig.toolkit_slug) {
      setError('Name and toolkit are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await apiService.createAuthConfig(newConfig);
      setShowCreateForm(false);
      setNewConfig({ name: '', toolkit_slug: '', auth_scheme: 'OAUTH2' });
      await loadAuthConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create auth config');
      console.error('Error creating auth config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this auth configuration?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await apiService.deleteAuthConfig(configId);
      await loadAuthConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete auth config');
      console.error('Error deleting auth config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadAuthConfigs();
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ENABLED':
        return 'text-green-600 bg-green-100';
      case 'DISABLED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getAuthSchemeColor = (scheme: string) => {
    switch (scheme.toUpperCase()) {
      case 'OAUTH2':
        return 'text-blue-600 bg-blue-100';
      case 'API_KEY':
        return 'text-purple-600 bg-purple-100';
      case 'BASIC':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Configurations</h2>
        
        {/* Search and Create Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search auth configs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Search
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Create New Config
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Create Auth Configuration</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Configuration Name
                  </label>
                  <input
                    type="text"
                    value={newConfig.name}
                    onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="My Custom Config"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Toolkit
                  </label>
                  <select
                    value={newConfig.toolkit_slug}
                    onChange={(e) => setNewConfig({ ...newConfig, toolkit_slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a toolkit...</option>
                    {toolkits.map((toolkit) => (
                      <option key={toolkit.slug} value={toolkit.slug}>
                        {toolkit.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auth Scheme
                  </label>
                  <select
                    value={newConfig.auth_scheme}
                    onChange={(e) => setNewConfig({ ...newConfig, auth_scheme: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="OAUTH2">OAuth 2.0</option>
                    <option value="API_KEY">API Key</option>
                    <option value="BASIC">Basic Auth</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateConfig}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auth Configs List */}
      {loading && !showCreateForm ? (
        <div className="text-center py-8">
          <div className="text-gray-600">Loading auth configurations...</div>
        </div>
      ) : authConfigs.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-600">No auth configurations found.</div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {authConfigs.map((config) => (
            <div
              key={config.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">{config.name}</h3>
                  <p className="text-sm text-gray-600">{config.toolkit.slug}</p>
                </div>
                {config.toolkit.logo && (
                  <img
                    src={config.toolkit.logo}
                    alt={config.toolkit.name || config.toolkit.slug}
                    className="w-8 h-8 rounded"
                  />
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(config.status)}`}>
                    {config.status}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Auth Scheme:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAuthSchemeColor(config.auth_scheme)}`}>
                    {config.auth_scheme}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Connections:</span>
                  <span className="text-sm font-medium">{config.no_of_connections}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Managed:</span>
                  <span className="text-sm">
                    {config.is_composio_managed ? '✅ Composio' : '🔧 Custom'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {onAuthConfigSelect && (
                  <button
                    onClick={() => onAuthConfigSelect(config)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Select
                  </button>
                )}
                {!config.is_composio_managed && (
                  <button
                    onClick={() => handleDeleteConfig(config.id)}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuthConfigManager;
