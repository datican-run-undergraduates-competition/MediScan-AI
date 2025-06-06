import React, { useState, useEffect } from 'react';
import { FaCog, FaBell, FaUser, FaShieldAlt, FaLanguage, FaMoon, FaSun } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      analysisComplete: true,
      errorAlerts: true,
    },
    appearance: {
      theme: 'light',
      fontSize: 'medium',
      language: 'en',
    },
    privacy: {
      dataRetention: '30',
      shareAnalytics: true,
      autoDelete: false,
    },
    account: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Doctor',
      department: 'Radiology',
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedSettings, setEditedSettings] = useState(null);

  useEffect(() => {
    // Load settings from localStorage or API
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // In a real app, this would be an API call
      // For now, we'll use the default settings
      setSettings(settings);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    }
  };

  const handleSettingChange = (category, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      // In a real app, this would be an API call
      // For now, we'll just show a success message
      toast.success('Settings saved successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleCancel = () => {
    setSettings(editedSettings);
    setIsEditing(false);
  };

  const startEditing = () => {
    setEditedSettings(JSON.parse(JSON.stringify(settings)));
    setIsEditing(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">Settings</h1>
        <p className="text-gray-600">
          Manage your preferences and system settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Settings Menu</h2>
            </div>
            <nav className="p-4">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => document.getElementById('notifications').scrollIntoView()}
                    className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100"
                  >
                    <FaBell className="text-blue-500" />
                    <span>Notifications</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => document.getElementById('appearance').scrollIntoView()}
                    className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100"
                  >
                    <FaCog className="text-blue-500" />
                    <span>Appearance</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => document.getElementById('privacy').scrollIntoView()}
                    className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100"
                  >
                    <FaShieldAlt className="text-blue-500" />
                    <span>Privacy</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => document.getElementById('account').scrollIntoView()}
                    className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100"
                  >
                    <FaUser className="text-blue-500" />
                    <span>Account</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notifications Settings */}
          <div id="notifications" className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Notification Settings</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-500">
                    Receive notifications via email
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.email}
                    onChange={(e) =>
                      handleSettingChange('notifications', 'email', e.target.checked)
                    }
                    className="sr-only peer"
                    disabled={!isEditing}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-gray-500">
                    Receive push notifications in browser
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.push}
                    onChange={(e) =>
                      handleSettingChange('notifications', 'push', e.target.checked)
                    }
                    className="sr-only peer"
                    disabled={!isEditing}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Analysis Complete Alerts</p>
                  <p className="text-sm text-gray-500">
                    Get notified when analysis is complete
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.analysisComplete}
                    onChange={(e) =>
                      handleSettingChange(
                        'notifications',
                        'analysisComplete',
                        e.target.checked
                      )
                    }
                    className="sr-only peer"
                    disabled={!isEditing}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Appearance Settings */}
          <div id="appearance" className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Appearance Settings</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <div className="flex space-x-4">
                  <button
                    onClick={() =>
                      handleSettingChange('appearance', 'theme', 'light')
                    }
                    className={`p-3 rounded-lg flex items-center space-x-2 ${
                      settings.appearance.theme === 'light'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100'
                    }`}
                    disabled={!isEditing}
                  >
                    <FaSun />
                    <span>Light</span>
                  </button>
                  <button
                    onClick={() =>
                      handleSettingChange('appearance', 'theme', 'dark')
                    }
                    className={`p-3 rounded-lg flex items-center space-x-2 ${
                      settings.appearance.theme === 'dark'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100'
                    }`}
                    disabled={!isEditing}
                  >
                    <FaMoon />
                    <span>Dark</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Size
                </label>
                <select
                  value={settings.appearance.fontSize}
                  onChange={(e) =>
                    handleSettingChange('appearance', 'fontSize', e.target.value)
                  }
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  disabled={!isEditing}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={settings.appearance.language}
                  onChange={(e) =>
                    handleSettingChange('appearance', 'language', e.target.value)
                  }
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  disabled={!isEditing}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div id="privacy" className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Privacy Settings</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Retention Period (days)
                </label>
                <input
                  type="number"
                  value={settings.privacy.dataRetention}
                  onChange={(e) =>
                    handleSettingChange('privacy', 'dataRetention', e.target.value)
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  min="1"
                  max="365"
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Share Analytics</p>
                  <p className="text-sm text-gray-500">
                    Share anonymous usage data to help improve the service
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.privacy.shareAnalytics}
                    onChange={(e) =>
                      handleSettingChange('privacy', 'shareAnalytics', e.target.checked)
                    }
                    className="sr-only peer"
                    disabled={!isEditing}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-delete Old Data</p>
                  <p className="text-sm text-gray-500">
                    Automatically delete data older than retention period
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.privacy.autoDelete}
                    onChange={(e) =>
                      handleSettingChange('privacy', 'autoDelete', e.target.checked)
                    }
                    className="sr-only peer"
                    disabled={!isEditing}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div id="account" className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Account Settings</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={settings.account.name}
                  onChange={(e) =>
                    handleSettingChange('account', 'name', e.target.value)
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={settings.account.email}
                  onChange={(e) =>
                    handleSettingChange('account', 'email', e.target.value)
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={settings.account.role}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={settings.account.department}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  disabled
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-end space-x-4">
        {!isEditing ? (
          <button
            onClick={startEditing}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Edit Settings
          </button>
        ) : (
          <>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Changes
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Settings; 