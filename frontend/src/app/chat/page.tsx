'use client';

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
  alpha
} from '@mui/material';
import { 
  Send as SendIcon, 
  AttachFile as AttachFileIcon, 
  Mic as MicIcon,
  SentimentSatisfiedAlt as EmojiIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';

// Mock messages for initial display
const initialMessages = [
  {
    id: 1,
    sender: 'system',
    content: 'Welcome to Ai-Med Assistant. How can I help you today?',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 2,
    sender: 'user',
    content: 'I need help interpreting my recent blood test results.',
    timestamp: new Date(Date.now() - 3500000).toISOString()
  },
  {
    id: 3,
    sender: 'system',
    content: 'I can help with that. Please share your test results or specific values you\'d like me to explain.',
    timestamp: new Date(Date.now() - 3400000).toISOString()
  }
];

export default function ChatPage() {
  const theme = useTheme();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (input.trim() === '') return;
    
    // Add user message
    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };
    
    setMessages([...messages, userMessage]);
    setInput('');
    
    // Simulate AI typing
    setIsTyping(true);
    
    // Simulate AI response after delay
    setTimeout(() => {
      const aiMessage = {
        id: messages.length + 2,
        sender: 'system',
        content: getAIResponse(input),
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };
  
  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Simple mock AI response generator
  const getAIResponse = (userInput: string) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('blood test') || input.includes('test results')) {
      return 'To interpret your blood test results properly, I\'d need to see the specific values. Common tests include CBC, metabolic panel, lipid panel, etc. Could you share the specific results or values you\'re concerned about?';
    } else if (input.includes('headache') || input.includes('pain')) {
      return 'Headaches can have many causes, including stress, dehydration, lack of sleep, or more serious conditions. How long have you been experiencing this pain, and what are the symptoms? Have you taken any medication for it?';
    } else if (input.includes('appointment') || input.includes('schedule')) {
      return 'I can help you schedule an appointment. Please provide your preferred date, time, and doctor or specialty you need to see.';
    } else if (input.includes('hello') || input.includes('hi')) {
      return 'Hello! How can I assist you with your medical questions today?';
    } else {
      return 'I understand you\'re asking about "' + userInput + '". To give you the best guidance, could you provide more details about your medical concern?';
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
            <IconButton size="small" sx={{ mr: 1 }}>
              <MicIcon />
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
    </Container>
  );
}
