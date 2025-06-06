import React, { useState } from 'react';
import { Container, Paper, Typography, Box, TextField, Button } from '@mui/material';
import { FaMicrophone, FaVolumeUp } from 'react-icons/fa';
import SpeechRecognition from '../components/voice/SpeechRecognition';
import TextToSpeech from '../components/voice/TextToSpeech';
import uploadService from '../services/uploadService';

/**
 * VoiceAssistant page component
 */
const VoiceAssistant = () => {
  const [command, setCommand] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCommand = async (text) => {
    setCommand(text);
    setIsProcessing(true);

    try {
      const result = await uploadService.getVoiceCommandResponse(text);
      setResponse(result.data.response);
    } catch (error) {
      console.error('Error processing voice command:', error);
      setResponse('Sorry, I encountered an error processing your command.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Voice Assistant
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Use voice commands to interact with MediScan AI. You can ask about:
        </Typography>
        <ul>
          <li>Uploading and analyzing medical images</li>
          <li>Getting analysis results</li>
          <li>Checking system status</li>
          <li>Navigating through the application</li>
        </ul>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Your Command
          </Typography>
          <TextField
            fullWidth
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Type or speak your command..."
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <SpeechRecognition onCommand={handleCommand} />
            <Button
              variant="contained"
              onClick={() => handleCommand(command)}
              disabled={!command || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Send Command'}
            </Button>
          </Box>
        </Box>

        {response && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Assistant's Response
            </Typography>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                bgcolor: 'background.default',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <TextToSpeech text={response} />
              <Typography>{response}</Typography>
            </Paper>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default VoiceAssistant; 
