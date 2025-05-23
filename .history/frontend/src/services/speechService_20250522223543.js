import api from './api';

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
    formData.append('file', audioFile);
    formData.append('language', language);
    
    return api.post('/speech/recognize', formData, {
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
    
    return api.post('/speech/synthesize', formData, {
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
    const formData = new FormData();
    formData.append('text', text);
    formData.append('language', language);
    
    return api.post('/speech/synthesize/base64', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  /**
   * Play audio from base64 encoded string
   * @param {string} base64Audio - Base64 encoded audio data
   * @param {string} contentType - Content type (default: 'audio/mp3')
   */
  playAudioFromBase64: (base64Audio, contentType = 'audio/mp3') => {
    const audio = new Audio(`data:${contentType};base64,${base64Audio}`);
    audio.play();
  },
};

export default speechService; 