'use client';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import React, { useState, useRef, useEffect } from 'react';
import { Container, Box, Typography, TextField, Button, Paper, IconButton, Card, CardContent, 
  CircularProgress, useTheme, alpha, Grid, Divider, Tooltip, Snackbar, Alert, Switch, FormControlLabel } from '@mui/material';
import { Mic as MicIcon, MicOff as MicOffIcon, VolumeUp as VolumeUpIcon, Send as SendIcon,
  Delete as DeleteIcon, VolumeOff as VolumeOffIcon } from '@mui/icons-material';
import axios from 'axios';
import { useDarkMode } from '../../contexts/DarkModeContext';
import DarkModeToggle from '../../components/DarkModeToggle';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function VoicePage() {
  const theme = useTheme();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [processing, setProcessing] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Initialize speech recognition - only on client
  useEffect(() => {
    // Safety check to ensure we're running in a browser environment
    if (typeof window === 'undefined') return;

    try {
      // Check for speech recognition support
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          const result = event.results[event.results.length - 1];
          const transcriptText = result[0].transcript;
          setTranscript(transcriptText);
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event);
          setIsListening(false);
          setNotification({
            open: true,
            message: `Error with speech recognition: ${event.error}`,
            severity: 'error'
          });
        };
      } else {
        setIsBrowserSupported(false);
        setNotification({
          open: true,
          message: 'Speech recognition is not supported in your browser',
          severity: 'error'
        });
      }
      
      // Initialize speech synthesis
      if ('speechSynthesis' in window) {
        synthesisRef.current = new SpeechSynthesisUtterance();
      } else {
        console.warn('Speech synthesis not supported');
      }
    } catch (error) {
      console.error('Error initializing speech APIs:', error);
      setIsBrowserSupported(false);
      setNotification({
        open: true,
        message: 'Error initializing speech recognition',
        severity: 'error'
      });
    }
    
    return () => {
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error('Error stopping speech recognition:', err);
        }
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  
  const toggleListening = () => {
    if (!recognitionRef.current || !isBrowserSupported) {
      setNotification({
        open: true,
        message: 'Speech recognition is not supported in your browser',
        severity: 'error'
      });
      return;
    }
    
    if (isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (err) {
        console.error('Error stopping speech recognition:', err);
      }
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Error starting speech recognition:', err);
        setNotification({
          open: true,
          message: 'Error starting speech recognition',
          severity: 'error'
        });
      }
    }
  };
  
  const speakResponse = (text: string) => {
    if (!synthesisRef.current || typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }
    
    try {
      window.speechSynthesis.cancel();
      synthesisRef.current.text = text;
      window.speechSynthesis.speak(synthesisRef.current);
    } catch (error) {
      console.error('Error speaking response:', error);
    }
  };
  
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  const handleSubmit = async () => {
    if (!transcript.trim()) return;
    
    setProcessing(true);
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (err) {
        console.error('Error stopping speech recognition:', err);
      }
    }
    
    try {
      // Call backend API
      const response = await axios.post(`${API_URL}/api/voice/query`, {
        query: transcript
      });
      
      const responseText = response.data.response || "I'm sorry, I couldn't process your request.";
      setResponse(responseText);
      
      if (autoSpeak) {
        speakResponse(responseText);
      }
    } catch (error) {
      console.error('Error processing voice query:', error);
      const fallbackResponse = "I'm sorry, I encountered an error while processing your request.";
      setResponse(fallbackResponse);
      
      if (autoSpeak) {
        speakResponse(fallbackResponse);
      }
      
      setNotification({
        open: true,
        message: 'Failed to connect to the voice service',
        severity: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" fontWeight="bold" color="primary">
              Voice Assistant
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoSpeak}
                    onChange={() => setAutoSpeak(!autoSpeak)}
                    color="primary"
                  />
                }
                label="Auto-Speak"
              />
              <DarkModeToggle />
            </Box>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {!isBrowserSupported ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="error">
                Speech Recognition Not Supported
              </Typography>
              <Typography variant="body1" sx={{ mt: 2 }}>
                Your browser does not support the Speech Recognition API needed for this feature.
                Please try using a modern browser like Chrome, Edge, or Safari.
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Voice Input
                </Typography>
                
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  placeholder="Your voice will appear here..."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  disabled={isListening || processing}
                  sx={{ mb: 2 }}
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="contained"
                    color={isListening ? "error" : "primary"}
                    startIcon={isListening ? <MicOffIcon /> : <MicIcon />}
                    onClick={toggleListening}
                    disabled={processing}
                  >
                    {isListening ? "Stop Listening" : "Start Listening"}
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    endIcon={<SendIcon />}
                    onClick={handleSubmit}
                    disabled={!transcript.trim() || processing}
                  >
                    Submit
                  </Button>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  AI Response
                </Typography>
                
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    minHeight: '100px',
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {processing ? (
                    <Box sx={{ textAlign: 'center' }}>
                      <CircularProgress size={24} thickness={4} sx={{ mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Processing your request...
                      </Typography>
                    </Box>
                  ) : response ? (
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body1">{response}</Typography>
                      {typeof window !== 'undefined' && window.speechSynthesis && (
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                          <IconButton 
                            size="small" 
                            onClick={() => speakResponse(response)}
                            color="primary"
                          >
                            <VolumeUpIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                      AI response will appear here
                    </Typography>
                  )}
                </Paper>
              </Box>
            </>
          )}
        </Paper>
      </Box>
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity as 'error' | 'warning' | 'info' | 'success'} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}