import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaRobot, FaPaperPlane, FaTrash, FaSpinner, FaDownload, FaSave, FaMicrophone, FaSearch, FaExclamationTriangle } from 'react-icons/fa';
import SpeechRecognition from './SpeechRecognition';
import TextToSpeech from './TextToSpeech';
import chatbotService from '../../services/chatbotService';
import uploadService from '../../services/uploadService';

/**
 * Enhanced VoiceChat component combines speech recognition, text-to-speech, and chatbot functionality
 * with improved low-connectivity handling and advanced features
 */
const VoiceChat = ({ language = 'en-US' }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState(null);
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [autoPlayVoice, setAutoPlayVoice] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(null);
  const messagesEndRef = useRef(null);
  const chatHistoryRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setOfflineMode(false);
      processPendingMessages();
    };
    
    const handleOffline = () => {
      setOfflineMode(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load chat history on component mount
  useEffect(() => {
    loadChatHistory();
    
    // Also load pending messages from localStorage
    const savedPendingMessages = localStorage.getItem('pendingChatMessages');
    if (savedPendingMessages) {
      setPendingMessages(JSON.parse(savedPendingMessages));
    }
  }, []);

  // Process pending messages when we go back online
  useEffect(() => {
    if (!offlineMode && pendingMessages.length > 0) {
      processPendingMessages();
    }
  }, [offlineMode, pendingMessages]);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsContextMenuOpen(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Load chat history from the server or local cache
  const loadChatHistory = async () => {
    setIsLoadingHistory(true);
    
    try {
      // Try to get from localStorage first for instant loading
      const cachedHistory = localStorage.getItem('chatHistory');
      if (cachedHistory) {
        setMessages(JSON.parse(cachedHistory));
      }
      
      // If we're offline, don't try to load from server
      if (offlineMode) {
        setIsLoadingHistory(false);
        return;
      }
      
      // Then try to get from server
      const response = await chatbotService.getHistory();
      
      if (response.data.success) {
        setMessages(response.data.history || []);
        
        // Cache in localStorage for offline use
        localStorage.setItem('chatHistory', JSON.stringify(response.data.history || []));
      } else {
        setError(response.data.error || 'Failed to load chat history');
      }
    } catch (err) {
      console.error('Chat history error:', err);
      
      if (!navigator.onLine) {
        setError('You are offline. Showing cached history.');
      } else {
        setError(err.message || 'Error loading chat history');
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Process any pending messages that were saved while offline
  const processPendingMessages = async () => {
    if (pendingMessages.length === 0) return;
    
    // Make a copy to avoid race conditions during processing
    const messagesToProcess = [...pendingMessages];
    
    // Clear pending messages first to avoid duplicates
    setPendingMessages([]);
    localStorage.removeItem('pendingChatMessages');
    
    // Send each message one by one
    for (const pendingMessage of messagesToProcess) {
      try {
        await sendMessageToServer(pendingMessage.text, pendingMessage.voiceResponse);
      } catch (error) {
        console.error('Failed to send pending message:', error);
        
        // If sending fails, add it back to pending
        addToPendingMessages(pendingMessage.text, pendingMessage.voiceResponse);
        break; // Stop processing if one fails
      }
    }
  };

  // Clear chat history
  const clearChatHistory = async () => {
    try {
      setIsLoading(true);
      
      if (offlineMode) {
        // Just clear local messages if offline
        setMessages([]);
        localStorage.setItem('chatHistory', JSON.stringify([]));
        setIsLoading(false);
        return;
      }
      
      const response = await chatbotService.clearHistory();
      
      if (response.data.success) {
        setMessages([]);
        localStorage.setItem('chatHistory', JSON.stringify([]));
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

  // Add a message to pending messages for later sending
  const addToPendingMessages = (text, voiceResponse = false) => {
    const newPending = [...pendingMessages, { 
      id: Date.now().toString(),
      text, 
      voiceResponse,
      timestamp: Date.now()
    }];
    
    setPendingMessages(newPending);
    localStorage.setItem('pendingChatMessages', JSON.stringify(newPending));
  };

  // Send message directly to the server
  const sendMessageToServer = async (text, voiceResponse = false) => {
    try {
      // Send to API
      const response = await chatbotService.sendMessage(text, voiceResponse);
      
      if (response.data.success) {
        // Add bot response to the chat
        const botMessage = { 
          role: 'assistant', 
          content: response.data.response,
          audio: voiceResponse ? response.data.audio : null,
          timestamp: Date.now()
        };
        
        setMessages(prev => {
          const newMessages = [...prev, botMessage];
          // Update localStorage cache
          localStorage.setItem('chatHistory', JSON.stringify(newMessages));
          return newMessages;
        });
        
        return response.data;
      } else {
        setError(response.data.error || 'Failed to get response from chatbot');
        throw new Error(response.data.error || 'Failed to get response from chatbot');
      }
    } catch (err) {
      console.error('Send message to server error:', err);
      throw err;
    }
  };

  // Send message to chatbot
  const sendMessage = async (text, voiceResponse = false) => {
    if (!text || text.trim() === '') return;
    
    // Add user message to the chat
    const userMessage = { 
      role: 'user', 
      content: text,
      timestamp: Date.now()
    };
    
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      // Update localStorage cache
      localStorage.setItem('chatHistory', JSON.stringify(newMessages));
      return newMessages;
    });
    
    // Clear input field
    setInputText('');
    setError(null);
    
    try {
      setIsLoading(true);
      
      // If offline, store message for later
      if (offlineMode) {
        addToPendingMessages(text, voiceResponse);
        setIsLoading(false);
        setError('You are offline. Message will be sent when connection is restored.');
        return;
      }
      
      // Send to server
      await sendMessageToServer(text, voiceResponse);
    } catch (err) {
      console.error('Send message error:', err);
      
      // If network error, save for later
      if (!navigator.onLine || err.message === 'Network Error') {
        setOfflineMode(true);
        addToPendingMessages(text, voiceResponse);
        setError('Connection lost. Message saved and will be sent when online.');
      } else {
        setError(err.message || 'Error sending message');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputText, autoPlayVoice);
  };

  // Handle recognized speech text
  const handleSpeechRecognized = (text) => {
    setInputText(text);
    // Automatically send the message with voice response
    sendMessage(text, true);
  };

  // Toggle continuous listening mode
  const toggleListening = () => {
    setIsListening(!isListening);
    
    if (!isListening) {
      setError(null);
    }
  };

  // Search in chat history
  const searchInHistory = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      const query = searchQuery.toLowerCase();
      const results = messages.filter(message => 
        message.content.toLowerCase().includes(query)
      );
      
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  // Export chat history
  const exportChatHistory = () => {
    try {
      const historyData = JSON.stringify(messages, null, 2);
      const blob = new Blob([historyData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-history-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export chat history');
    }
  };

  // Handle context menu for message options
  const handleMessageContextMenu = (e, messageIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setIsContextMenuOpen(messageIndex);
  };

  // Copy message text to clipboard
  const copyMessageText = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Close context menu
        setIsContextMenuOpen(null);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        setError('Failed to copy message text');
      });
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto bg-white rounded-lg shadow-md">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center">
          <FaRobot className="mr-2 text-xl" />
          <h2 className="text-lg font-semibold">AI Medical Assistant</h2>
          {offlineMode && (
            <div className="ml-2 flex items-center text-yellow-200 text-sm">
              <FaExclamationTriangle className="mr-1" />
              <span>Offline Mode</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="p-2 hover:bg-blue-700 rounded-full"
            title="Options"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button 
            onClick={clearChatHistory}
            className="p-2 hover:bg-blue-700 rounded-full"
            title="Clear conversation"
            disabled={isLoading || messages.length === 0}
          >
            <FaTrash />
          </button>
          
          <button
            onClick={exportChatHistory}
            className="p-2 hover:bg-blue-700 rounded-full"
            title="Export conversation"
            disabled={isLoading || messages.length === 0}
          >
            <FaDownload />
          </button>
        </div>
      </div>
      
      {/* Advanced options panel (collapsible) */}
      {showAdvancedOptions && (
        <div className="bg-gray-100 p-3 border-b">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoVoice"
                checked={autoPlayVoice}
                onChange={() => setAutoPlayVoice(!autoPlayVoice)}
                className="mr-2"
              />
              <label htmlFor="autoVoice" className="text-sm">Auto Voice Response</label>
            </div>
            
            <div className="flex items-center">
              <label htmlFor="voiceSpeed" className="text-sm mr-2">Voice Speed:</label>
              <select
                id="voiceSpeed"
                value={voiceSpeed}
                onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="0.75">Slow (0.75x)</option>
                <option value="1">Normal (1x)</option>
                <option value="1.25">Fast (1.25x)</option>
                <option value="1.5">Very Fast (1.5x)</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <button
                onClick={toggleListening}
                className={`flex items-center text-sm px-3 py-1 rounded ${
                  isListening ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                }`}
              >
                <FaMicrophone className="mr-1" />
                <span>{isListening ? 'Stop Listening' : 'Continuous Listening'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Search bar */}
      <div className="p-2 border-b">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchInHistory()}
            placeholder="Search conversation..."
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        
        {searchResults.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      
      {/* Pending messages notification */}
      {pendingMessages.length > 0 && (
        <div className="bg-yellow-50 p-2 border-b border-yellow-100">
          <p className="text-yellow-700 text-sm">
            You have {pendingMessages.length} pending message{pendingMessages.length !== 1 ? 's' : ''} that will be sent when you're back online.
          </p>
        </div>
      )}
      
      {/* Messages area */}
      <div 
        ref={chatHistoryRef}
        className="flex-grow p-4 overflow-y-auto"
      >
        {isLoadingHistory ? (
          <div className="flex justify-center items-center h-full">
            <FaSpinner className="animate-spin text-blue-500 text-xl mr-2" />
            <span className="text-gray-500">Loading conversation history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 my-8">
            Start a conversation with the AI Medical Assistant
          </div>
        ) : searchResults.length > 0 ? (
          // Show search results
          searchResults.map((message, index) => (
            <div 
              key={`search-${index}`} 
              className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
            >
              <div 
                className={`inline-block px-4 py-2 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                } border-2 border-yellow-400`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {message.timestamp && (
                  <div className="text-xs text-gray-500 mt-1">
                    {formatTime(message.timestamp)}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          // Show normal chat
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
              onContextMenu={(e) => handleMessageContextMenu(e, index)}
            >
              <div 
                className={`inline-block px-4 py-2 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                } relative`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {message.timestamp && (
                  <div className="text-xs text-gray-500 mt-1">
                    {formatTime(message.timestamp)}
                  </div>
                )}
                
                {message.role === 'assistant' && message.audio && (
                  <div className="mt-2">
                    <TextToSpeech 
                      text={message.content} 
                      language={language.split('-')[0]} 
                      speed={voiceSpeed}
                    />
                  </div>
                )}
                
                {/* Context menu */}
                {isContextMenuOpen === index && (
                  <div className="absolute z-10 mt-2 bg-white border rounded-md shadow-lg p-2 w-48">
                    <button 
                      onClick={() => copyMessageText(message.content)}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded"
                    >
                      Copy text
                    </button>
                    
                    {message.role === 'assistant' && (
                      <button 
                        onClick={() => {/* implement save to favorites */}}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded"
                      >
                        <FaSave className="inline mr-2" />
                        Save to favorites
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {error && (
          <div className="text-center text-red-500 my-2">{error}</div>
        )}
        
        {isListening && (
          <div className="fixed bottom-32 right-4">
            <div className="bg-blue-600 text-white px-3 py-2 rounded-full shadow-lg flex items-center">
              <FaMicrophone className="mr-2 animate-pulse" />
              <span>Listening...</span>
            </div>
          </div>
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
            placeholder={offlineMode ? "You are offline (message will be sent later)..." : "Type your message..."}
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`px-4 py-2 ${
              isLoading || !inputText.trim()
                ? 'bg-gray-300 cursor-not-allowed' 
                : offlineMode 
                  ? 'bg-yellow-500 hover:bg-yellow-600'
                  : 'bg-blue-600 hover:bg-blue-700'
            } text-white rounded-r-lg`}
            disabled={isLoading || !inputText.trim()}
          >
            {isLoading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaPaperPlane />
            )}
          </button>
        </form>
        
        <div className="mt-4 flex justify-center">
          {isListening ? (
            <button
              onClick={toggleListening}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3"
              title="Stop listening"
            >
              <FaSpinner className="animate-spin" />
            </button>
          ) : (
            <SpeechRecognition 
              onTextRecognized={handleSpeechRecognized} 
              language={language}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceChat; 
