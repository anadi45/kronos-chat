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
          {/* Slack Integration */}
          <div className="integration-card">
            <div className="integration-icon">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52-2.523A2.528 2.528 0 0 1 5.042 10.12h2.52v2.522a2.528 2.528 0 0 1-2.52 2.523zm0-6.75H2.522A2.528 2.528 0 0 1 0 5.892a2.528 2.528 0 0 1 2.522-2.523h2.52v2.523a2.528 2.528 0 0 1-2.52 2.523zm6.75 0a2.528 2.528 0 0 1-2.523-2.523V5.892H5.042A2.528 2.528 0 0 1 2.52 3.369a2.528 2.528 0 0 1 2.522-2.523h2.52v2.523a2.528 2.528 0 0 1-2.523 2.523zm0 6.75a2.528 2.528 0 0 1 2.523 2.523v2.522h2.522A2.528 2.528 0 0 1 18.75 18.631a2.528 2.528 0 0 1-2.523-2.523h-2.522v-2.522a2.528 2.528 0 0 1-2.523-2.523zm6.75 0a2.528 2.528 0 0 1 2.523-2.523A2.528 2.528 0 0 1 18.75 10.12h-2.522v2.522a2.528 2.528 0 0 1-2.523 2.523zm0-6.75h2.522A2.528 2.528 0 0 1 24 5.892a2.528 2.528 0 0 1-2.523 2.523h-2.522V5.892a2.528 2.528 0 0 1 2.523-2.523z"/>
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

          {/* Discord Integration */}
          <div className="integration-card">
            <div className="integration-icon">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
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

          {/* GitHub Integration */}
          <div className="integration-card">
            <div className="integration-icon">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
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

          {/* Notion Integration */}
          <div className="integration-card">
            <div className="integration-icon">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.033-.793c1.026-.047 1.495.14 1.962.7l4.577 6.813c.327.466.514.933.514 1.68v11.15c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.68-1.632z"/>
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

          {/* Gmail Integration */}
          <div className="integration-card">
            <div className="integration-icon">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.904.732-1.636 1.636-1.636h.91L12 10.09l9.455-6.27h.909c.904 0 1.636.732 1.636 1.636z"/>
              </svg>
            </div>
            <h3 className="integration-title">Gmail</h3>
            <p className="integration-description">
              Send and manage emails through Gmail integration
            </p>
            <div className="integration-status">
              <span className="status-badge available">Available</span>
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
