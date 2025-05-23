import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Speech Recognition and Synthesis Service
 */
const speechService = {
  /**
   * Convert speech audio to text
   * @param {File} audioFile - Audio file (WAV format)
   * @param {string} language - Language code (default: 'en-US')
   * @returns {Promise} - The API response
   */
  recognizeSpeech: async (audioFile, language = 'en-US') => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('language', language);
    
    return axios.post(`${API_URL}/speech/recognize`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  /**
   * Convert text to speech and download as audio file
   * @param {string} text - Text to convert to speech
   * @param {string} language - Language code (default: 'en')
   * @param {string} outputFormat - Output audio format (default: 'mp3')
   * @returns {Promise} - The API response
   */
  synthesizeSpeech: async (text, language = 'en', outputFormat = 'mp3') => {
    const formData = new FormData();
    formData.append('text', text);
    formData.append('language', language);
    formData.append('output_format', outputFormat);
    
    return axios.post(`${API_URL}/speech/synthesize`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob',
    });
  },
  
  /**
   * Convert text to speech and return base64 encoded audio
   * @param {string} text - Text to convert to speech
   * @param {string} language - Language code (default: 'en')
   * @returns {Promise} - The API response
   */
  synthesizeSpeechBase64: async (text, language = 'en') => {
    return axios.post(`${API_URL}/speech/synthesize`, { 
      text, 
      language 
    });
  },
  
  /**
   * Play audio from base64 string
   * @param {string} base64Audio - Base64 encoded audio data
   */
  playAudioFromBase64: (base64Audio) => {
    // Create audio element
    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    
    // Play audio
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
    });
  },
};

export default speechService; 
