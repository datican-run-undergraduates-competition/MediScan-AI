import React, { useState } from 'react';
import { FaPlay, FaSpinner, FaVolumeUp } from 'react-icons/fa';
import speechService from '../../services/speechService';

/**
 * TextToSpeech component allows converting text to speech and playing it
 */
const TextToSpeech = ({ text, language = 'en' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Convert text to speech and play audio
  const speakText = async () => {
    if (!text || text.trim() === '') {
      setError('Please provide text to speak');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Get base64 encoded audio from API
      const response = await speechService.synthesizeSpeechBase64(text, language);
      
      // Check response
      if (response.data.success) {
        setIsPlaying(true);
        
        // Play the audio
        speechService.playAudioFromBase64(response.data.audio);
        
        // Reset playing state after audio finishes (approximate based on text length)
        const approximateDuration = Math.max(2, text.length * 0.05); // Rough estimate
        setTimeout(() => {
          setIsPlaying(false);
        }, approximateDuration * 1000);
      } else {
        setError(response.data.error || 'Text-to-speech conversion failed');
      }
    } catch (err) {
      setError(err.message || 'Error generating speech');
      console.error('Text-to-speech error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={speakText}
        disabled={isLoading || isPlaying || !text}
        className={`rounded-full p-2 shadow-md flex items-center justify-center transition-colors ${
          isPlaying 
            ? 'bg-green-500' 
            : 'bg-blue-500 hover:bg-blue-600'
        } ${(isLoading || !text) ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Speak text"
      >
        {isLoading ? (
          <FaSpinner className="text-white text-lg animate-spin" />
        ) : isPlaying ? (
          <FaVolumeUp className="text-white text-lg" />
        ) : (
          <FaPlay className="text-white text-lg" />
        )}
      </button>
      
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
    </div>
  );
};

export default TextToSpeech; 
