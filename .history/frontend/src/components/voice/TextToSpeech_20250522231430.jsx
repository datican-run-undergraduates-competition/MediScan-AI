import React, { useState, useRef } from 'react';
import { FaPlay, FaSpinner, FaVolumeUp, FaPause, FaVolumeDown, FaVolumeMute } from 'react-icons/fa';
import speechService from '../../services/speechService';

/**
 * Enhanced TextToSpeech component allows converting text to speech and playing it
 * with adjustable speed and volume
 */
const TextToSpeech = ({ text, language = 'en', speed = 1.0 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [cachedAudio, setCachedAudio] = useState(null);
  const audioRef = useRef(new Audio());
  
  // Convert text to speech and play audio
  const speakText = async () => {
    if (!text || text.trim() === '') {
      setError('Please provide text to speak');
      return;
    }

    try {
      // If we're already playing, pause the audio
      if (isPlaying) {
        pauseAudio();
        return;
      }
      
      // If we have cached audio, use it instead of making a new request
      if (cachedAudio) {
        playAudio(cachedAudio);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      // Get base64 encoded audio from API
      const response = await speechService.synthesizeSpeechBase64(text, language);
      
      // Check response
      if (response.data.success) {
        // Cache the audio data
        setCachedAudio(response.data.audio);
        
        // Play the audio
        playAudio(response.data.audio);
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
  
  // Play audio with current settings
  const playAudio = (audioData) => {
    try {
      // Clean up previous audio instance
      audioRef.current.pause();
      
      // Create new audio instance
      audioRef.current = new Audio(`data:audio/mp3;base64,${audioData}`);
      
      // Configure audio
      audioRef.current.playbackRate = speed;
      audioRef.current.volume = isMuted ? 0 : volume;
      
      // Setup event handlers
      audioRef.current.onplay = () => setIsPlaying(true);
      audioRef.current.onpause = () => setIsPlaying(false);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = (error) => {
        console.error('Audio playback error:', error);
        setError('Failed to play audio');
        setIsPlaying(false);
      };
      
      // Play audio
      const playPromise = audioRef.current.play();
      
      // Handle play promise
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Audio play promise error:', error);
          setIsPlaying(false);
        });
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setError('Failed to play audio');
    }
  };
  
  // Pause currently playing audio
  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };
  
  // Toggle mute state
  const toggleMute = (e) => {
    e.stopPropagation();
    
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
      } else {
        audioRef.current.volume = 0;
      }
    }
    
    setIsMuted(!isMuted);
  };
  
  // Update volume
  const handleVolumeChange = (e) => {
    e.stopPropagation();
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (audioRef.current && !isMuted) {
      audioRef.current.volume = newVolume;
    }
    
    // If volume is set to zero, mute; if volume is increased from zero, unmute
    if (newVolume === 0 && !isMuted) {
      setIsMuted(true);
    } else if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };
  
  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);
  
  // Update audio speed when speed prop changes
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={speakText}
        disabled={isLoading || (!text && !cachedAudio)}
        className={`rounded-full p-2 shadow-md flex items-center justify-center transition-colors ${
          isPlaying 
            ? 'bg-green-500 hover:bg-green-600' 
            : 'bg-blue-500 hover:bg-blue-600'
        } ${(isLoading || (!text && !cachedAudio)) ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isPlaying ? "Pause speech" : "Speak text"}
      >
        {isLoading ? (
          <FaSpinner className="text-white text-lg animate-spin" />
        ) : isPlaying ? (
          <FaPause className="text-white text-lg" />
        ) : (
          <FaPlay className="text-white text-lg" />
        )}
      </button>
      
      {isPlaying && (
        <div className="flex items-center space-x-1">
          <button
            onClick={toggleMute}
            className="text-blue-600 hover:text-blue-800 p-1"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <FaVolumeMute />
            ) : volume <= 0.5 ? (
              <FaVolumeDown />
            ) : (
              <FaVolumeUp />
            )}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-blue-200 rounded-lg appearance-none cursor-pointer"
            title={`Volume: ${Math.round(volume * 100)}%`}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
    </div>
  );
};

export default TextToSpeech; 
