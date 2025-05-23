import React, { useState, useRef } from 'react';
import { FaMicrophone, FaSpinner, FaStopCircle } from 'react-icons/fa';
import speechService from '../../services/speechService';

/**
 * SpeechRecognition component allows users to record audio and convert it to text
 */
const SpeechRecognition = ({ onTextRecognized, language = 'en-US' }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Start recording audio
  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      // Handle audio data
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Handle recording stop
      mediaRecorderRef.current.onstop = async () => {
        // Create audio blob from recorded chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // Convert to file for API
        const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
        
        try {
          setIsProcessing(true);
          
          // Send to API for recognition
          const response = await speechService.recognizeSpeech(audioFile, language);
          
          // Check response
          if (response.data.success) {
            // Call callback with recognized text
            if (onTextRecognized) {
              onTextRecognized(response.data.text);
            }
          } else {
            setError(response.data.error || 'Speech recognition failed');
          }
        } catch (err) {
          setError(err.message || 'Error processing speech');
          console.error('Speech recognition error:', err);
        } finally {
          setIsProcessing(false);
        }
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError(err.message || 'Error accessing microphone');
      console.error('Microphone access error:', err);
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-2">
        {error && (
          <div className="text-red-500 text-sm mb-2">{error}</div>
        )}
        
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`rounded-full p-4 shadow-md flex items-center justify-center transition-colors ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isProcessing ? (
            <FaSpinner className="text-white text-2xl animate-spin" />
          ) : isRecording ? (
            <FaStopCircle className="text-white text-2xl" />
          ) : (
            <FaMicrophone className="text-white text-2xl" />
          )}
        </button>
      </div>
      
      <div className="text-sm text-gray-600">
        {isRecording ? 'Recording... Click to stop' : isProcessing ? 'Processing...' : 'Click to speak'}
      </div>
    </div>
  );
};

export default SpeechRecognition; 
