import React, { useEffect, useRef } from 'react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const TextToSpeech = ({ text, isEnabled = true }) => {
  const speechRef = useRef(null);

  useEffect(() => {
    if (!isEnabled || !text) return;

    // Cancel any ongoing speech
    if (speechRef.current) {
      window.speechSynthesis.cancel();
    }

    // Create new speech synthesis
    const speech = new SpeechSynthesisUtterance(text);
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;

    // Get available voices and set a good one
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      voice => voice.name.includes('Google') || voice.name.includes('Microsoft')
    );
    if (preferredVoice) {
      speech.voice = preferredVoice;
    }

    // Store reference and speak
    speechRef.current = speech;
    window.speechSynthesis.speak(speech);

    // Cleanup
    return () => {
      if (speechRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [text, isEnabled]);

  const toggleSpeech = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    } else if (text) {
      window.speechSynthesis.speak(speechRef.current);
    }
  };

  return (
    <button
      onClick={toggleSpeech}
      className={`p-2 rounded-full ${
        window.speechSynthesis.speaking
          ? 'bg-blue-500 text-white'
          : 'bg-gray-200 text-gray-700'
      } hover:bg-opacity-80 transition-colors`}
      title={window.speechSynthesis.speaking ? 'Stop speaking' : 'Start speaking'}
    >
      {window.speechSynthesis.speaking ? <FaVolumeMute /> : <FaVolumeUp />}
    </button>
  );
};

export default TextToSpeech; 