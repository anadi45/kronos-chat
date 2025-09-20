import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { type UserProfile } from '@kronos/core';

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
    if (path.startsWith('/oauth-integrations')) return 'integrations';
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

  const shouldShowLogo = () => {
    const section = getCurrentSection();
    // Hide logo for chat, integrations, and settings
    return !['chat', 'integrations', 'settings'].includes(section);
  };

  const shouldShowHeader = () => {
    const section = getCurrentSection();
    // Show header for chat, integrations, and settings
    return ['chat', 'integrations', 'settings'].includes(section);
  };

  const shouldShowHeaderBox = () => {
    const section = getCurrentSection();
    // Hide header box styling for chat, integrations, and settings
    return !['chat', 'integrations', 'settings'].includes(section);
  };

  return (
    <div className="h-screen gradient-bg flex">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={handleSidebarToggle}
        activeSection={getCurrentSection()}
        onSectionChange={() => {
          // This will be handled by React Router navigation
        }}
        user={user}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden main-content">
        {/* Header */}
        {shouldShowHeader() && (
          <header className={shouldShowHeaderBox() ? "glass border-b border-white/10 shadow-lg" : ""}>
            <div className="px-6">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    {shouldShowLogo() && (
                      <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <h1 className="text-xl font-semibold text-white">
                      {getPageTitle()}
                    </h1>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {/* User info can be shown here if needed, but logout is now in sidebar */}
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
