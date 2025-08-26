import { useState } from 'react'
import './App.css'
import EnhancedOAuthManager from './components/EnhancedOAuthManager'
import AuthConfigManager from './components/AuthConfigManager'
import OAuthCallback from './components/OAuthCallback'
import ToolExecutor from './components/ToolExecutor'
import IntegrationDashboard from './components/IntegrationDashboard'
import ChatInterface from './components/ChatInterface'
import AuthWrapper from './components/AuthWrapper'
import { type UserProfile } from './services/apiService'

interface AppProps {
  user?: UserProfile;
  onLogout?: () => void;
}

function App({ user, onLogout }: AppProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard' | 'connections' | 'auth-configs' | 'tools' | 'callback'>('chat')

  const renderContent = () => {
    const userId = user?.id || "unknown";
    
    switch (activeTab) {
      case 'chat':
        return <ChatInterface userId={userId} />
      case 'dashboard':
        return <IntegrationDashboard userId={userId} />
      case 'connections':
        return <EnhancedOAuthManager userId={userId} />
      case 'auth-configs':
        return <AuthConfigManager userId={userId} />
      case 'tools':
        return <ToolExecutor />
      case 'callback':
        return <OAuthCallback />
      default:
        return <ChatInterface userId={userId} />
    }
  }

  return (
    <div className={`${activeTab === 'chat' ? 'h-screen' : 'min-h-screen'} bg-gray-100 flex flex-col`}>
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Kronos Chat</h1>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-2">
                  <div className="text-sm">
                    <span className="text-gray-600">Welcome, </span>
                    <span className="font-medium text-gray-900">
                      {user.first_name || user.email}
                    </span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <svg className="-ml-1 mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
              <div className="text-sm text-gray-600">
                Powered by Composio Integration
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'chat', label: 'AI Chat', icon: '💬' },
              { id: 'dashboard', label: 'Integration Dashboard', icon: '📊' },
              { id: 'connections', label: 'OAuth Connections', icon: '🔗' },
              { id: 'auth-configs', label: 'Auth Configurations', icon: '⚙️' },
              { id: 'tools', label: 'Tool Executor', icon: '🛠️' },
              { id: 'callback', label: 'OAuth Callback', icon: '↩️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`${activeTab === 'chat' ? 'flex-1 flex flex-col overflow-hidden' : 'max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'}`}>
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {renderContent()}
          </div>
        ) : (
          <div className="px-4 py-6 sm:px-0">
            {renderContent()}
          </div>
        )}
      </main>

      {/* Footer - Hidden for chat interface */}
      {activeTab !== 'chat' && (
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="text-center text-sm text-gray-600">
              Enhanced with{' '}
              <a
                href="https://docs.composio.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                Composio
              </a>{' '}
              for robust OAuth integration
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

// Wrapped App component with authentication
const WrappedApp = () => (
  <AuthWrapper>
    <App />
  </AuthWrapper>
);

export default WrappedApp
