import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { type UserProfile } from '@quark/core';

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
    if (path.startsWith('/conversations')) return 'conversations';
    if (path.startsWith('/oauth-integrations')) return 'integrations';
    if (path.startsWith('/settings')) return 'settings';
    return 'chat'; // default
  };

  const getPageTitle = () => {
    const section = getCurrentSection();
    switch (section) {
      case 'chat': return 'Chat';
      case 'conversations': return 'Conversations';
      case 'integrations': return 'Integrations';
      case 'settings': return 'Settings';
      default: return 'Chat';
    }
  };

  const shouldShowLogo = () => {
    const section = getCurrentSection();
    // Hide logo for chat, conversations, integrations, and settings
    return !['chat', 'conversations', 'integrations', 'settings'].includes(section);
  };

  const shouldShowHeader = () => {
    const section = getCurrentSection();
    // Show header for chat, conversations, integrations, and settings
    return ['chat', 'conversations', 'integrations', 'settings'].includes(section);
  };

  const shouldShowHeaderBox = () => {
    const section = getCurrentSection();
    // Hide header box styling for chat, conversations, integrations, and settings
    return !['chat', 'conversations', 'integrations', 'settings'].includes(section);
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
          <header className={shouldShowHeaderBox() ? "glass border-b border-white/10 shadow-lg px-6" : "px-6"}>
            <div className="flex justify-between items-center pt-4 pb-1">
              <div className="flex items-center space-x-4" style={{ paddingTop: '3rem' }}>
                <div className="flex items-center space-x-3">
                  {shouldShowLogo() && (
                    <div className="h-8 w-8 rounded-full flex items-center justify-center">
                      <img src="/logo.png" alt="Quark Chat" className="h-6 w-6" />
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
