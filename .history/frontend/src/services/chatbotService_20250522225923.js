import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Service for handling chatbot-related API calls
 */
const chatbotService = {
  /**
   * Send a message to the chatbot
   * @param {string} message - User's message
   * @param {boolean} voiceResponse - Whether to get voice response
   * @returns {Promise} - API response
   */
  sendMessage: async (message, voiceResponse = false) => {
    return axios.post(`${API_URL}/chatbot/message`, {
      message,
      voiceResponse
    });
  },
  
  /**
   * Get chat history
   * @returns {Promise} - API response
   */
  getHistory: async () => {
    return axios.get(`${API_URL}/chatbot/history`);
  },
  
  /**
   * Clear chat history
   * @returns {Promise} - API response
   */
  clearHistory: async () => {
    return axios.delete(`${API_URL}/chatbot/history`);
  }
};

export default chatbotService; 
