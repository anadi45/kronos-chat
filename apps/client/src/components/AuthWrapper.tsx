import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { type UserProfile } from '@kronos/core';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Set up periodic token refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        // Check if token is close to expiring (within 5 minutes)
        const loginTime = localStorage.getItem('loginTime');
        const expiresIn = localStorage.getItem('expiresIn');
        
        if (loginTime && expiresIn) {
          const now = Date.now();
          const loginTimestamp = parseInt(loginTime);
          const expirationTime = loginTimestamp + parseInt(expiresIn) * 1000;
          const timeUntilExpiry = expirationTime - now;
          
          // Refresh if token expires within 5 minutes
          if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
            await apiService.refreshToken();
            console.log('Token refreshed automatically');
          }
        }
      } catch (error) {
        console.error('Automatic token refresh failed:', error);
        // If refresh fails, logout user
        await apiService.logout();
        setIsAuthenticated(false);
        setUser(null);
      }
    }, 60000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    
    if (apiService.isAuthenticated()) {
      try {
        const userProfile = await apiService.getCurrentUser();
        setUser(userProfile);
        setIsAuthenticated(true);
      } catch (error) {
        // Token might be invalid, try to refresh first
        try {
          await apiService.refreshToken();
          const userProfile = await apiService.getCurrentUser();
          setUser(userProfile);
          setIsAuthenticated(true);
        } catch (refreshError) {
          // Refresh failed, clear auth and redirect to login
          await apiService.logout();
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    
    setIsLoading(false);
  };


  const handleLogout = async () => {
    await apiService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="glass p-8 rounded-2xl shadow-2xl border border-white/10">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Loading Kronos Chat</h3>
              <p className="text-gray-400 text-sm">Please wait while we authenticate...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authentication is now handled by routing, so we don't render login/signup forms here
  // The routing logic in App.tsx will handle showing the appropriate forms

  // Clone children and inject user, logout function, and authentication status
  return (
    <>
      {React.cloneElement(children as React.ReactElement, {
        user,
        onLogout: handleLogout,
        isAuthenticated
      } as any)}
    </>
  );
};

export default AuthWrapper;
