import axios from 'axios';
import api from './api';

/**
 * Chatbot Service
 */
const chatbotService = {
  /**
   * Send a message to the chatbot
   * @param {string} message - User's message
   * @param {boolean} voiceResponse - Whether to include a voice response
   * @returns {Promise} - The API response
   */
  sendMessage: async (message, voiceResponse = false) => {
    return api.post('/chatbot/message', {
      message,
      voice_response: voiceResponse,
    });
  },
  
  /**
   * Get conversation history
   * @returns {Promise} - The API response
   */
  getHistory: async () => {
    return api.get('/chatbot/history');
  },
  
  /**
   * Clear conversation history
   * @returns {Promise} - The API response
   */
  clearHistory: async () => {
    return api.post('/chatbot/clear');
  },
};

export default chatbotService; 
