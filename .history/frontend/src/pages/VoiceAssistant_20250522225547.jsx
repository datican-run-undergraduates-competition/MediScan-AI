import React, { useState } from 'react';
import VoiceChat from '../components/voice/VoiceChat';

/**
 * VoiceAssistant page component
 */
const VoiceAssistant = () => {
  const [language, setLanguage] = useState('en-US');

  // Language options
  const languageOptions = [
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'es-ES', label: 'Spanish' },
    { value: 'fr-FR', label: 'French' },
    { value: 'de-DE', label: 'German' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">Voice Assistant</h1>
        <p className="text-gray-600">Talk to our AI medical assistant using your voice</p>
      </div>

      <div className="mb-6 max-w-md mx-auto">
        <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
          Select Language
        </label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="h-[70vh]">
        <VoiceChat language={language} />
      </div>
    </div>
  );
};

export default VoiceAssistant; 
