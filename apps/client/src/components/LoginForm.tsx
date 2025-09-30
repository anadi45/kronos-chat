import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import { type UserLogin } from '@kronos/core';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToSignup }) => {
  const [formData, setFormData] = useState<UserLogin>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiService.login(formData);
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Background decorative elements */}
      <div className="auth-background">
        <div className="auth-background-element"></div>
        <div className="auth-background-element"></div>
        <div className="auth-background-element"></div>
      </div>

      <div className="auth-form-wrapper">
        {/* Logo/Brand Section */}
        <div className="auth-header">
          <div className="auth-logo">
            <img src="/logo.png" alt="Quark Chat" className="auth-logo-image" />
          </div>
          <h2 className="auth-title">
            Welcome Back
          </h2>
          <p className="auth-subtitle">
            Sign in to your Quark Chat account
          </p>
        </div>

        {/* Login Form */}
        <div className="auth-form-card">
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label htmlFor="email" className="auth-label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="auth-input"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="password" className="auth-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="auth-input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>

            {error && (
              <div className="auth-error">
                <svg className="auth-error-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="auth-submit-btn"
            >
              <div className="auth-submit-content">
                {loading ? (
                  <>
                    <svg className="auth-submit-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="auth-submit-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Sign In
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Switch to Signup */}
          <div className="auth-switch">
            <p className="auth-switch-text">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignup}
                className="auth-switch-link"
              >
                Create one now
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <p className="auth-footer-text">Powered by Kronos Chat • Secure & Private</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
