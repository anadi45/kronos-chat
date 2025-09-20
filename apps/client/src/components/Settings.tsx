import React, { useState } from 'react';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
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
