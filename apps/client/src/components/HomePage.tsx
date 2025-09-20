import React from 'react';
import { Link } from 'react-router-dom';
import { type UserProfile } from '@kronos/core';

interface HomePageProps {
  user?: UserProfile;
  onLogout?: () => void;
}

const HomePage: React.FC<HomePageProps> = () => {
  const features = [
    {
      title: 'AI Chat',
      description: 'Start conversations with our intelligent AI assistant',
      icon: '💬',
      path: '/chat',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Integrations',
      description: 'Connect with your favorite tools and services',
      icon: '🔗',
      path: '/oauth-integrations',
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Settings',
      description: 'Customize your experience and preferences',
      icon: '⚙️',
      path: '/settings',
      color: 'from-purple-500 to-violet-600'
    }
  ];

  return (
    <div className="h-screen gradient-bg flex flex-col">
      {/* Header */}
      <header className="glass border-b border-white/10 shadow-lg">
        <div className="px-6">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-white">Kronos AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* User info can be shown here if needed, but logout is now in sidebar */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl w-full">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-4">
                <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Welcome to Kronos AI
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Your intelligent assistant for conversations, integrations, and productivity. 
                Get started by exploring our features below.
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {features.map((feature) => (
              <Link
                key={feature.path}
                to={feature.path}
                className="group block"
              >
                <div className="glass rounded-xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/10">
                  <div className="text-center">
                    <div className={`h-16 w-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-2xl">{feature.icon}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 group-hover:text-gray-200 transition-colors">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="text-center">
            <div className="glass rounded-xl p-8 border border-white/10">
              <h2 className="text-2xl font-semibold text-white mb-4">Quick Start</h2>
              <p className="text-gray-300 mb-6">
                Ready to get started? Jump right into a conversation with our AI assistant.
              </p>
              <Link
                to="/chat"
                className="btn btn-primary px-8 py-3 text-lg font-medium rounded-lg inline-flex items-center space-x-2 hover:scale-105 transition-transform"
              >
                <span>Start Chatting</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="glass border-t border-white/10 py-4">
        <div className="px-6 text-center">
          <p className="text-sm text-gray-400">
            Kronos AI v1.0 - Your intelligent assistant for productivity and creativity
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
