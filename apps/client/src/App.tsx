import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import ChatInterface from './components/ChatInterface'
import Integrations from './components/Integrations'
import Settings from './components/Settings'
import HomePage from './components/HomePage'
import Layout from './components/Layout'
import AuthWrapper from './components/AuthWrapper'
import { type UserProfile } from '@kronos/core'

interface AppProps {
  user?: UserProfile;
  onLogout?: () => void;
}

function App({ user, onLogout }: AppProps) {
  const userId = user?.id || "unknown";

  return (
    <Router>
      <Routes>
        {/* Home page route */}
        <Route 
          path="/" 
          element={<HomePage user={user} onLogout={onLogout} />} 
        />
        
        {/* Layout routes with sidebar */}
        <Route 
          path="/chat" 
          element={
            <Layout user={user} onLogout={onLogout}>
              <ChatInterface userId={userId} />
            </Layout>
          } 
        />
        
        <Route 
          path="/integrations" 
          element={
            <Layout user={user} onLogout={onLogout}>
              <Integrations />
            </Layout>
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            <Layout user={user} onLogout={onLogout}>
              <Settings />
            </Layout>
          } 
        />
        
        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

// Wrapped App component with authentication
const WrappedApp = () => (
  <AuthWrapper>
    <App />
  </AuthWrapper>
);

export default WrappedApp
