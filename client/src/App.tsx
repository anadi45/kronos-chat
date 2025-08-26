import { useState } from 'react'
import './App.css'
import EnhancedOAuthManager from './components/EnhancedOAuthManager'
import AuthConfigManager from './components/AuthConfigManager'
import OAuthCallback from './components/OAuthCallback'
import ToolExecutor from './components/ToolExecutor'

function App() {
  const [activeTab, setActiveTab] = useState<'connections' | 'auth-configs' | 'tools' | 'callback'>('connections')

  const renderContent = () => {
    switch (activeTab) {
      case 'connections':
        return <EnhancedOAuthManager userId="demo-user" />
      case 'auth-configs':
        return <AuthConfigManager userId="demo-user" />
      case 'tools':
        return <ToolExecutor />
      case 'callback':
        return <OAuthCallback />
      default:
        return <EnhancedOAuthManager userId="demo-user" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Kronos Chat</h1>
            <div className="text-sm text-gray-600">
              Powered by Composio Integration
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {renderContent()}
        </div>
      </main>

      {/* Footer */}
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
    </div>
  )
}

export default App
