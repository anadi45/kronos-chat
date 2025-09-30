import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import { type UserSignup } from '@quark/core';

interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState<UserSignup>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
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

  const validateForm = (): string | null => {
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      await apiService.signup(formData);
      // Auto-login after successful signup
      await apiService.login({
        email: formData.email,
        password: formData.password
      });
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
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
            Join Quark Chat
          </h2>
          <p className="auth-subtitle">
            Create your account and start chatting
          </p>
        </div>

        {/* Signup Form */}
        <div className="auth-form-card">
          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Name Fields */}
            <div className="auth-form-row">
              <div className="auth-form-group">
                <label htmlFor="firstName" className="auth-label">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="auth-input"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="auth-form-group">
                <label htmlFor="lastName" className="auth-label">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="auth-input"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Email Field */}
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

            {/* Password Fields */}
            <div className="auth-form-group">
              <label htmlFor="password" className="auth-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="auth-input"
                placeholder="Create a password (min 8 characters)"
                value={formData.password}
                onChange={handleInputChange}
              />
              <p className="auth-password-hint">Must be at least 8 characters long</p>
            </div>

            <div className="auth-form-group">
              <label htmlFor="confirmPassword" className="auth-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="auth-input"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
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
                    Creating account...
                  </>
                ) : (
                  <>
                    <svg className="auth-submit-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                    Create Account
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Switch to Login */}
          <div className="auth-switch">
            <p className="auth-switch-text">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="auth-switch-link"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <p className="auth-footer-text">Powered by Quark Chat • Secure & Private</p>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
