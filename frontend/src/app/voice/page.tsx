'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { voiceAPI } from '../services/api';

export default function VoicePage() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      handleVoiceCommand(transcript);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript('');
      setResponse('');
    }
  };

  const handleVoiceCommand = async (command: string) => {
    if (!command.trim()) return;

    setIsProcessing(true);
    try {
      const result = await voiceAPI.processVoiceCommand(command);
      setResponse(result.response);

      // Speak the response
      const utterance = new SpeechSynthesisUtterance(result.response);
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error processing voice command:', error);
      setResponse('Sorry, I encountered an error processing your request.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Voice Assistant</h2>
            <p className="text-sm text-gray-500">Speak to interact with the medical system</p>
          </div>

          <div className="p-6">
            <div className="flex flex-col items-center space-y-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleListening}
                className={`w-24 h-24 rounded-full flex items-center justify-center ${
                  isListening ? 'bg-red-500' : 'bg-indigo-600'
                } text-white shadow-lg`}
              >
                <motion.div
                  animate={{
                    scale: isListening ? [1, 1.2, 1] : 1,
                  }}
                  transition={{
                    duration: 1,
                    repeat: isListening ? Infinity : 0,
                  }}
                >
                  {isListening ? '🎤' : '🎤'}
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {transcript && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full max-w-lg"
                  >
                    <div className="bg-gray-100 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">You said:</h3>
                      <p className="text-gray-700">{transcript}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex space-x-2"
                >
                  <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" />
                  <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce delay-100" />
                  <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce delay-200" />
                </motion.div>
              )}

              <AnimatePresence>
                {response && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full max-w-lg"
                  >
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-indigo-900 mb-2">Assistant:</h3>
                      <p className="text-indigo-700">{response}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 