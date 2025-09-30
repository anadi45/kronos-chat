import React, { useState } from 'react';
import { type UserProfile } from '@quark/core';

interface SettingsProps {
  user?: UserProfile;
}

const Settings: React.FC<SettingsProps> = ({ user }) => {
  const [settings, setSettings] = useState({});

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <p className="text-gray-300">Customize your Quark experience</p>
      </div>

      <div className="page-content">
        <div className="settings-sections">
          {/* Account Section */}
          <div className="settings-section">
            <h2 className="section-title">Account</h2>
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <label className="setting-label">Name</label>
                  <p className="setting-description">Your display name</p>
                </div>
                <div className="setting-control">
                  <div className="account-info-display">
                    <span className="account-info-value">
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : 'Not available'
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label className="setting-label">Email</label>
                  <p className="setting-description">Your email address</p>
                </div>
                <div className="setting-control">
                  <div className="account-info-display">
                    <span className="account-info-value">{user?.email || 'Not available'}</span>
                  </div>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label className="setting-label">Change Password</label>
                  <p className="setting-description">Enter your new password</p>
                </div>
                <div className="setting-control">
                  <input
                    type="password"
                    placeholder="Enter new password"
                    className="chat-input"
                    style={{
                      minHeight: '2.5rem',
                      maxHeight: '2.5rem',
                      resize: 'none'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Conversations Section */}
          <div className="settings-section">
            <h2 className="section-title">Conversations</h2>
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <label className="setting-label">Export Conversations</label>
                  <p className="setting-description">Download your chat history and conversations</p>
                </div>
                <div className="setting-control">
                  <button className="btn btn-primary">
                    Export Conversations
                  </button>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label className="setting-label">Clear All Conversations</label>
                  <p className="setting-description">Permanently delete all your conversations</p>
                </div>
                <div className="setting-control">
                  <button className="btn btn-danger">
                    Clear All Conversations
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="settings-footer">
          <button className="btn btn-primary">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
