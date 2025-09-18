import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import ChatInterface from './components/ChatInterface'
import Integrations from './components/Integrations'
import Settings from './components/Settings'
import HomePage from './components/HomePage'
import Layout from './components/Layout'
import AuthWrapper from './components/AuthWrapper'
import LoginForm from './components/LoginForm'
import SignupForm from './components/SignupForm'
import { type UserProfile } from '@kronos/core'

interface AppProps {
  user?: UserProfile;
  onLogout?: () => void;
  isAuthenticated?: boolean;
}

function App({ user, onLogout, isAuthenticated }: AppProps) {
  const userId = user?.id || "unknown";

  return (
    <Router>
      <Routes>
        {/* Home page route - only accessible when authenticated */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <HomePage user={user} onLogout={onLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Login route - only accessible when not authenticated */}
        <Route 
          path="/login" 
          element={
            !isAuthenticated ? (
              <LoginForm 
                onSuccess={() => window.location.reload()} 
                onSwitchToSignup={() => window.location.href = '/signup'}
              />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        {/* Signup route - only accessible when not authenticated */}
        <Route 
          path="/signup" 
          element={
            !isAuthenticated ? (
              <SignupForm 
                onSuccess={() => window.location.reload()} 
                onSwitchToLogin={() => window.location.href = '/login'}
              />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        {/* Layout routes with sidebar - only accessible when authenticated */}
        <Route 
          path="/chat" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={onLogout}>
                <ChatInterface userId={userId} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route 
          path="/integrations" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={onLogout}>
                <Integrations />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={onLogout}>
                <Settings />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Redirect any unknown routes to appropriate page based on auth status */}
        <Route 
          path="*" 
          element={
            <Navigate to={isAuthenticated ? "/" : "/login"} replace />
          } 
        />
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
