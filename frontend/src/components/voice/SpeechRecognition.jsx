import React, { useState, useEffect, useCallback } from 'react';
import { FaMicrophone, FaSpinner, FaStop } from 'react-icons/fa';

/**
 * SpeechRecognition component provides a UI to capture voice input from the user
 */
const SpeechRecognition = ({ onTextRecognized, language = 'en-US' }) => {
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);

  // Initialize speech recognition
  useEffect(() => {
    // Check if speech recognition is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setErrorMessage('Speech recognition is not supported in this browser.');
      return;
    }

    // Create speech recognition object
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    // Configure recognition
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = language;

    // Set up event handlers
    recognitionInstance.onstart = () => {
      setIsListening(true);
      setIsLoading(false);
      setErrorMessage('');
    };

    recognitionInstance.onerror = (event) => {
      setIsListening(false);
      setIsLoading(false);
      
      if (event.error === 'no-speech') {
        setErrorMessage('No speech was detected. Please try again.');
      } else if (event.error === 'audio-capture') {
        setErrorMessage('No microphone was found or microphone is disabled.');
      } else if (event.error === 'not-allowed') {
        setErrorMessage('Permission to use microphone was denied.');
      } else {
        setErrorMessage(`Error occurred: ${event.error}`);
      }
      
      console.error('Speech recognition error:', event.error);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      setIsLoading(false);
      
      // If we have a transcript, call the callback
      if (transcript && transcript.trim() !== '') {
        onTextRecognized(transcript);
        setTranscript('');
      }
    };

    recognitionInstance.onresult = (event) => {
      const current = event.resultIndex;
      const result = event.results[current];
      
      if (result.isFinal) {
        setTranscript(result[0].transcript);
      }
    };

    // Store recognition instance
    setRecognition(recognitionInstance);

    // Cleanup
    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [language, onTextRecognized, transcript]);

  // Start/stop listening
  const toggleListening = useCallback(() => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
    } else {
      setIsLoading(true);
      setTranscript('');
      recognition.start();
    }
  }, [isListening, recognition]);

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={toggleListening}
        disabled={!recognition || isLoading}
        className={`rounded-full w-14 h-14 flex items-center justify-center shadow-md transition-colors ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-blue-500 hover:bg-blue-600'
        } ${!recognition ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isListening ? 'Stop listening' : 'Start listening'}
      >
        {isLoading ? (
          <FaSpinner className="text-white text-xl animate-spin" />
        ) : isListening ? (
          <FaStop className="text-white text-xl" />
        ) : (
          <FaMicrophone className="text-white text-xl" />
        )}
      </button>
      
      {errorMessage && (
        <div className="text-red-500 text-sm mt-2 text-center">{errorMessage}</div>
      )}
      
      {isListening && (
        <div className="text-blue-600 text-sm mt-2 animate-pulse">Listening...</div>
      )}
    </div>
  );
};

export default SpeechRecognition; 
