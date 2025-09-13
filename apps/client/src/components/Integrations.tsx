import React from 'react';

const Integrations: React.FC = () => {
  return (
    <div className="integrations-page">
      <div className="page-header">
        <h1 className="text-2xl font-bold text-white mb-2">Integrations</h1>
        <p className="text-gray-300">Connect Kronos with your favorite tools and services</p>
      </div>

      <div className="page-content">
        <div className="integrations-grid">
          {/* Coming Soon Card */}
          <div className="integration-card">
            <div className="integration-icon">
              <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="integration-title">Slack</h3>
            <p className="integration-description">
              Connect Kronos to your Slack workspace for seamless team communication
            </p>
            <div className="integration-status">
              <span className="status-badge coming-soon">Coming Soon</span>
            </div>
          </div>

          <div className="integration-card">
            <div className="integration-icon">
              <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="integration-title">Discord</h3>
            <p className="integration-description">
              Bring Kronos AI to your Discord server for community interactions
            </p>
            <div className="integration-status">
              <span className="status-badge coming-soon">Coming Soon</span>
            </div>
          </div>

          <div className="integration-card">
            <div className="integration-icon">
              <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="integration-title">GitHub</h3>
            <p className="integration-description">
              Integrate with GitHub for code assistance and repository management
            </p>
            <div className="integration-status">
              <span className="status-badge coming-soon">Coming Soon</span>
            </div>
          </div>

          <div className="integration-card">
            <div className="integration-icon">
              <svg className="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="integration-title">Notion</h3>
            <p className="integration-description">
              Connect with Notion for document creation and knowledge management
            </p>
            <div className="integration-status">
              <span className="status-badge coming-soon">Coming Soon</span>
            </div>
          </div>
        </div>

        <div className="integrations-info">
          <div className="info-card">
            <h3 className="text-lg font-semibold text-white mb-3">About Integrations</h3>
            <p className="text-gray-300 mb-4">
              Kronos integrations allow you to connect with your favorite tools and services, 
              making your AI assistant available wherever you work.
            </p>
            <div className="feature-list">
              <div className="feature-item">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Seamless connectivity</span>
              </div>
              <div className="feature-item">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Real-time synchronization</span>
              </div>
              <div className="feature-item">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Secure authentication</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Integrations;
