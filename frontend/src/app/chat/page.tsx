'use client';

// Add type declarations for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import React, { useState, useRef, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Avatar, 
  Divider,
  IconButton,
  CircularProgress,
  useTheme,
  alpha,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Send as SendIcon, 
  AttachFile as AttachFileIcon, 
  Mic as MicIcon,
  MicOff as MicOffIcon,
  SentimentSatisfiedAlt as EmojiIcon,
  MoreVert as MoreIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useDarkMode } from '../../contexts/DarkModeContext';
import axios from 'axios';

// Initial welcome message
const initialMessages = [
  {
    id: 1,
    sender: 'system',
    content: 'Welcome to Ai-Med Assistant. How can I help you today?',
    timestamp: new Date().toISOString()
  }
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ChatPage() {
  const theme = useTheme();
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');
        
        setInput(transcript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        setNotification({
          open: true,
          message: `Error with speech recognition: ${event.error}`,
          severity: 'error'
        });
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setNotification({
        open: true,
        message: 'Speech recognition is not supported in your browser',
        severity: 'error'
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Speech recognition error:', error);
      }
    }
    
    setIsListening(!isListening);
  };

  const handleSendMessage = async () => {
    if (input.trim() === '') return;
    
    // Stop speech recognition if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Simulate AI typing
    setIsTyping(true);

    try {
      // Call the backend API
      const response = await axios.post(`${API_URL}/api/chat`, {
        message: input,
        user_id: user?.id || 'guest'
      });
      
      const aiMessage = {
        id: Date.now() + 1,
        sender: 'system',
        content: response.data.response || "I'm sorry, I couldn't process your request.",
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback response in case of API failure
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'system',
        content: "I'm sorry, I encountered an error while processing your request. Please try again later.",
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      setNotification({
        open: true,
        message: 'Failed to connect to the chat service',
        severity: 'error'
      });
    } finally {
      setIsTyping(false);
    }
  };
  
  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Container maxWidth="md" sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', py: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Chat Header */}
        <Box 
          sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
          }}
        >
          <Avatar 
            src="/ai-assistant.png" 
            alt="AI Medical Assistant"
            sx={{ 
              width: 40, 
              height: 40, 
              mr: 2,
              bgcolor: theme.palette.primary.main
            }}
          >
            AI
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight={600}>AI Medical Assistant</Typography>
            <Typography variant="caption" color="text.secondary">
              Online • Responses are not a substitute for professional medical advice
            </Typography>
          </Box>
          <IconButton onClick={toggleDarkMode} sx={{ mr: 1 }}>
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          <IconButton>
            <MoreIcon />
          </IconButton>
        </Box>
        
        {/* Messages Area */}
        <Box 
          sx={{ 
            flexGrow: 1, 
            overflow: 'auto', 
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            backgroundColor: alpha(theme.palette.background.default, 0.5),
          }}
        >
              {messages.map((message) => (
            <Box 
                  key={message.id}
              sx={{ 
                alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '70%',
              }}
            >
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: message.sender === 'user' 
                    ? theme.palette.primary.main 
                    : theme.palette.background.paper,
                  color: message.sender === 'user' ? 'white' : 'text.primary',
                  borderRadius: message.sender === 'user' 
                    ? '16px 16px 4px 16px' 
                    : '16px 16px 16px 4px',
                  boxShadow: message.sender === 'user'
                    ? 'none'
                    : '0 2px 10px rgba(0, 0, 0, 0.05)',
                }}
              >
                <Typography variant="body1">{message.content}</Typography>
              </Paper>
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  mt: 0.5, 
                  ml: message.sender === 'user' ? 0 : 1,
                  mr: message.sender === 'user' ? 1 : 0,
                  textAlign: message.sender === 'user' ? 'right' : 'left',
                  color: 'text.secondary',
                }}
              >
                {formatTime(message.timestamp)}
              </Typography>
            </Box>
          ))}
          
          {/* AI typing indicator */}
          {isTyping && (
            <Box sx={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', ml: 1 }}>
              <CircularProgress size={20} thickness={6} sx={{ mr: 1 }} />
              <Typography variant="caption" color="text.secondary">
                AI is typing...
              </Typography>
            </Box>
          )}
          
          <div ref={endOfMessagesRef} />
        </Box>
        
        {/* Input Area */}
        <Box 
          sx={{ 
            p: 2, 
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <IconButton size="small" sx={{ mr: 1 }}>
              <AttachFileIcon />
            </IconButton>
            <IconButton size="small" sx={{ mr: 1 }}>
              <EmojiIcon />
            </IconButton>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message..."
              multiline
              maxRows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              sx={{ 
                mr: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '24px',
                  paddingRight: '14px',
                }
              }}
            />
            <IconButton 
              size="small" 
              sx={{ mr: 1, color: isListening ? 'error.main' : 'inherit' }}
              onClick={toggleListening}
            >
              {isListening ? <MicOffIcon /> : <MicIcon />}
            </IconButton>
            <Button 
              variant="contained" 
              color="primary" 
              endIcon={<SendIcon />}
              onClick={handleSendMessage}
              disabled={input.trim() === ''}
              sx={{ 
                borderRadius: '24px',
                px: 3,
                py: 1,
              }}
              >
                Send
            </Button>
          </Box>
        </Box>
      </Paper>
      
      <Snackbar open={notification.open} autoHideDuration={6000} onClose={handleCloseNotification}>
        <Alert onClose={handleCloseNotification} severity={notification.severity as 'error' | 'warning' | 'info' | 'success'} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
