import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { type UserProfile } from '@kronos/shared-types';

interface LayoutProps {
  user?: UserProfile;
  onLogout?: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Get the current section based on the pathname
  const getCurrentSection = () => {
    const path = location.pathname;
    if (path.startsWith('/chat')) return 'chat';
    if (path.startsWith('/integrations')) return 'integrations';
    if (path.startsWith('/settings')) return 'settings';
    return 'chat'; // default
  };

  const getPageTitle = () => {
    const section = getCurrentSection();
    switch (section) {
      case 'chat': return 'Chat';
      case 'integrations': return 'Integrations';
      case 'settings': return 'Settings';
      default: return 'Chat';
    }
  };

  return (
    <div className="h-screen gradient-bg flex">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={handleSidebarToggle}
        activeSection={getCurrentSection()}
        onSectionChange={(section) => {
          // This will be handled by React Router navigation
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="glass border-b border-white/10 shadow-lg">
          <div className="px-6">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h1 className="text-xl font-semibold text-white">
                    {getPageTitle()}
                  </h1>
                </div>
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
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
