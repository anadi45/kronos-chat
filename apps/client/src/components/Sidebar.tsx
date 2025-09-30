import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { type UserProfile } from '@quark/core';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
  user?: UserProfile;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggle,
  user,
  onLogout
}) => {
  const location = useLocation();

  const menuItems = [
    {
      id: 'chat',
      label: 'Chat',
      path: '/chat',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'conversations',
      label: 'Conversations',
      path: '/conversations',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'integrations',
      label: 'Integrations',
      path: '/oauth-integrations',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/settings',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Enhanced Sidebar Header */}
      <div className="sidebar-header">
        <div className={`sidebar-logo ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="sidebar-logo-icon">
            <img src="/logo.png" alt="Quark Chat" className="w-6 h-6" />
          </div>
          {!isCollapsed && (
            <span className="sidebar-logo-text">Quark</span>
          )}
        </div>
        {!isCollapsed ? (
          <button
            onClick={onToggle}
            className="sidebar-toggle"
            aria-label="Collapse sidebar"
          >
            <svg
              className="w-5 h-5 transition-all duration-300 ease-in-out"
              fill="currentColor"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
              <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onToggle}
            className="sidebar-toggle"
            aria-label="Expand sidebar"
          >
            <svg
              className="w-5 h-5 transition-all duration-300 ease-in-out"
              fill="currentColor"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
              <line x1="6" y1="18" x2="18" y2="6" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <Link
                to={item.path}
                className={`sidebar-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="sidebar-icon">{item.icon}</span>
                {!isCollapsed && (
                  <span className="sidebar-label">{item.label}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Enhanced Sidebar Footer */}
      <div className="sidebar-footer">
        {/* Enhanced User Profile Section */}
        {user && (
          <div className="sidebar-user-profile">
            <div className="sidebar-user-avatar">
              {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">
                  {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User'}
                </div>
                <div className="sidebar-user-email">
                  {user.email}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logout Button */}
        {user && (
          <button
            onClick={onLogout}
            className="sidebar-item w-full text-left"
            title={isCollapsed ? 'Logout' : undefined}
          >
            <span className="sidebar-icon">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
            </span>
            {!isCollapsed && (
              <span className="sidebar-label">Logout</span>
            )}
          </button>
        )}

        {!isCollapsed && (
          <div className="text-xs text-gray-500 text-center mt-3">
            Quark Chat v1.0
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
