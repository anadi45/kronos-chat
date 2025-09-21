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
    <div className="homepage-container">
      {/* Header */}
      <header className="homepage-header">
        <div className="homepage-header-content">
          <div className="homepage-logo-section">
            <div className="homepage-logo">
              <svg className="homepage-logo-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="homepage-title">Kronos AI</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="homepage-main">
        <div className="homepage-content">
          {/* Welcome Section */}
          <div className="homepage-welcome">
            <div className="homepage-welcome-content">
              <div className="homepage-welcome-icon">
                <svg className="homepage-welcome-icon-svg" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="homepage-welcome-title">
                Welcome to Kronos AI
              </h1>
              <p className="homepage-welcome-description">
                Your intelligent assistant for conversations, integrations, and productivity. 
                Get started by exploring our features below.
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="homepage-features-grid">
            {features.map((feature) => (
              <Link
                key={feature.path}
                to={feature.path}
                className="homepage-feature-link"
              >
                <div className="homepage-feature-card">
                  <div className="homepage-feature-content">
                    <div className={`homepage-feature-icon ${feature.color}`}>
                      <span className="homepage-feature-icon-emoji">{feature.icon}</span>
                    </div>
                    <h3 className="homepage-feature-title">
                      {feature.title}
                    </h3>
                    <p className="homepage-feature-description">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="homepage-quick-actions">
            <div className="homepage-quick-actions-card">
              <h2 className="homepage-quick-actions-title">Quick Start</h2>
              <p className="homepage-quick-actions-description">
                Ready to get started? Jump right into a conversation with our AI assistant.
              </p>
              <Link
                to="/chat"
                className="homepage-quick-actions-button"
              >
                <span>Start Chatting</span>
                <svg className="homepage-quick-actions-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="homepage-footer">
        <div className="homepage-footer-content">
          <p className="homepage-footer-text">
            Kronos AI v1.0 - Your intelligent assistant for productivity and creativity
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
