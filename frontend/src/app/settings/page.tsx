'use client';

import { useEffect, useState } from 'react';
import { settingsAPI } from '../services/api';
import { UserSettings } from '../types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsAPI.getUserSettings();
        setSettings(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      const updatedSettings = await settingsAPI.updateUserSettings(settings);
      setSettings(updatedSettings);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (section: keyof UserSettings, field: string, value: any) => {
    if (!settings) return;

    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Settings</h3>
              <p className="mt-1 text-sm text-gray-600">
                Manage your account settings and preferences.
              </p>
            </div>
          </div>

          <div className="mt-5 md:mt-0 md:col-span-2">
            <form onSubmit={handleSubmit}>
              <div className="shadow sm:rounded-md sm:overflow-hidden">
                <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                  {/* Notifications */}
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Notifications</h3>
                    <div className="mt-6 space-y-4">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            id="email-notifications"
                            checked={settings.notifications.email_notifications}
                            onChange={(e) => handleChange('notifications', 'email_notifications', e.target.checked)}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            aria-label="Enable email notifications"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="email-notifications" className="font-medium text-gray-700">
                            Email Notifications
                          </label>
                          <p className="text-gray-500">Receive notifications via email</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            id="push-notifications"
                            checked={settings.notifications.push_notifications}
                            onChange={(e) => handleChange('notifications', 'push_notifications', e.target.checked)}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            aria-label="Enable push notifications"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="push-notifications" className="font-medium text-gray-700">
                            Push Notifications
                          </label>
                          <p className="text-gray-500">Receive push notifications</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Appearance */}
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Appearance</h3>
                    <div className="mt-6 space-y-4">
                      <div>
                        <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                          Theme
                        </label>
                        <select
                          id="theme"
                          value={settings.appearance.theme}
                          onChange={(e) => handleChange('appearance', 'theme', e.target.value)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="font-size" className="block text-sm font-medium text-gray-700">
                          Font Size
                        </label>
                        <select
                          id="font-size"
                          value={settings.appearance.font_size}
                          onChange={(e) => handleChange('appearance', 'font_size', e.target.value)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Privacy */}
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Privacy</h3>
                    <div className="mt-6 space-y-4">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            id="share-analysis"
                            checked={settings.privacy.share_analysis}
                            onChange={(e) => handleChange('privacy', 'share_analysis', e.target.checked)}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            aria-label="Share analysis results"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="share-analysis" className="font-medium text-gray-700">
                            Share Analysis Results
                          </label>
                          <p className="text-gray-500">Allow sharing of analysis results with other healthcare providers</p>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="data-retention" className="block text-sm font-medium text-gray-700">
                          Data Retention (months)
                        </label>
                        <input
                          type="number"
                          id="data-retention"
                          value={settings.privacy.data_retention}
                          onChange={(e) => handleChange('privacy', 'data_retention', parseInt(e.target.value))}
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 