import React, { useState, useEffect, useRef } from 'react';
import { FaRobot, FaPaperPlane, FaTrash } from 'react-icons/fa';
import SpeechRecognition from './SpeechRecognition';
import TextToSpeech from './TextToSpeech';
import chatbotService from '../../services/chatbotService';

/**
 * VoiceChat component combines speech recognition, text-to-speech, and chatbot functionality
 */
const VoiceChat = ({ language = 'en-US' }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Load chat history on component mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history from the server
  const loadChatHistory = async () => {
    try {
      setIsLoading(true);
      const response = await chatbotService.getHistory();
      
      if (response.data.success) {
        setMessages(response.data.history || []);
      } else {
        setError(response.data.error || 'Failed to load chat history');
      }
    } catch (err) {
      setError(err.message || 'Error loading chat history');
      console.error('Chat history error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear chat history
  const clearChatHistory = async () => {
    try {
      setIsLoading(true);
      const response = await chatbotService.clearHistory();
      
      if (response.data.success) {
        setMessages([]);
      } else {
        setError(response.data.error || 'Failed to clear chat history');
      }
    } catch (err) {
      setError(err.message || 'Error clearing chat history');
      console.error('Clear history error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Send message to chatbot
  const sendMessage = async (text, voiceResponse = false) => {
    if (!text || text.trim() === '') return;
    
    // Add user message to the chat
    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input field
    setInputText('');
    
    try {
      setIsLoading(true);
      
      // Send to API
      const response = await chatbotService.sendMessage(text, voiceResponse);
      
      if (response.data.success) {
        // Add bot response to the chat
        const botMessage = { 
          role: 'assistant', 
          content: response.data.response,
          audio: voiceResponse ? response.data.audio : null
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        setError(response.data.error || 'Failed to get response from chatbot');
      }
    } catch (err) {
      setError(err.message || 'Error sending message');
      console.error('Send message error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  // Handle recognized speech text
  const handleSpeechRecognized = (text) => {
    setInputText(text);
    // Automatically send the message with voice response
    sendMessage(text, true);
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto bg-white rounded-lg shadow-md">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center">
          <FaRobot className="mr-2 text-xl" />
          <h2 className="text-lg font-semibold">AI Medical Assistant</h2>
        </div>
        <button 
          onClick={clearChatHistory}
          className="p-2 hover:bg-blue-700 rounded-full"
          title="Clear conversation"
        >
          <FaTrash />
        </button>
      </div>
      
      {/* Messages area */}
      <div className="flex-grow p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 my-8">
            Start a conversation with the AI Medical Assistant
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
            >
              <div 
                className={`inline-block px-4 py-2 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div>{message.content}</div>
                
                {message.role === 'assistant' && message.audio && (
                  <div className="mt-2">
                    <TextToSpeech text={message.content} language={language.split('-')[0]} />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {error && (
          <div className="text-center text-red-500 my-2">{error}</div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-grow px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`px-4 py-2 bg-blue-600 text-white rounded-r-lg ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
            disabled={isLoading || !inputText.trim()}
          >
            <FaPaperPlane />
          </button>
        </form>
        
        <div className="mt-4 flex justify-center">
          <SpeechRecognition 
            onTextRecognized={handleSpeechRecognized} 
            language={language}
          />
        </div>
      </div>
    </div>
  );
};

export default VoiceChat; 
