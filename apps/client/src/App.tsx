import { useState } from 'react'
import './App.css'
import EnhancedOAuthManager from './components/EnhancedOAuthManager'
import AuthConfigManager from './components/AuthConfigManager'
import OAuthCallback from './components/OAuthCallback'
import ToolExecutor from './components/ToolExecutor'
import IntegrationDashboard from './components/IntegrationDashboard'
import ChatInterface from './components/ChatInterface'
import AuthWrapper from './components/AuthWrapper'
import { type UserProfile } from '@kronos/shared-types'

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
    <div className={`${activeTab === 'chat' ? 'h-screen' : 'min-h-screen'} gradient-bg flex flex-col`}>
      {/* Header */}
      <header className="glass border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">Kronos Chat</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="text-sm">
                    <span className="text-gray-300">Welcome, </span>
                    <span className="font-medium text-white">
                      {user.firstName || user.email}
                    </span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="btn btn-danger px-3 py-2 text-sm font-medium rounded-lg"
                  >
                    <svg className="-ml-1 mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
              <div className="text-sm text-gray-400">
                Powered by Composio Integration
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto">
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
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
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
      <main className={`${activeTab === 'chat' ? 'flex-1 flex flex-col overflow-hidden' : 'max-w-7xl mx-auto py-6'}`}>
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {renderContent()}
          </div>
        ) : (
          <div className="px-4 py-6">
            <div className="glass p-6 rounded-2xl shadow-2xl border border-white/10">
              {renderContent()}
            </div>
          </div>
        )}
      </main>

      {/* Footer - Hidden for chat interface */}
      {activeTab !== 'chat' && (
        <footer className="glass border-t border-white/10 mt-12">
          <div className="max-w-7xl mx-auto py-4 px-4">
            <div className="text-center text-sm text-gray-400">
              Enhanced with{' '}
              <a
                href="https://docs.composio.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
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
