import React, { useState } from 'react';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    theme: 'dark',
    autoSave: true
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <p className="text-gray-300">Customize your Kronos experience</p>
      </div>

      <div className="page-content">
        <div className="settings-sections">
          {/* Appearance Section */}
          <div className="settings-section">
            <h2 className="section-title">Appearance</h2>
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <label className="setting-label">Theme</label>
                  <p className="setting-description">Choose your preferred color scheme</p>
                </div>
                <div className="setting-control">
                  <select
                    value={settings.theme}
                    onChange={(e) => handleSettingChange('theme', e.target.value)}
                    className="setting-select"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>
              </div>

            </div>
          </div>


          {/* Chat Section */}
          <div className="settings-section">
            <h2 className="section-title">Chat</h2>
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <label className="setting-label">Auto-save Conversations</label>
                  <p className="setting-description">Automatically save your chat history</p>
                </div>
                <div className="setting-control">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.autoSave}
                      onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>


          {/* Account Section */}
          <div className="settings-section">
            <h2 className="section-title">Account</h2>
            <div className="settings-group">
              <div className="setting-item">
                <div className="setting-info">
                  <label className="setting-label">Export Data</label>
                  <p className="setting-description">Download your chat history and settings</p>
                </div>
                <div className="setting-control">
                  <button className="btn btn-primary">
                    Export Data
                  </button>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label className="setting-label">Clear All Data</label>
                  <p className="setting-description">Permanently delete all your conversations and settings</p>
                </div>
                <div className="setting-control">
                  <button className="btn btn-danger">
                    Clear All Data
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
