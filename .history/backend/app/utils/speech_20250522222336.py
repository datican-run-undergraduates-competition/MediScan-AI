"""
Speech utilities for voice input and output in MediScan AI.
"""

import os
import tempfile
import logging
from typing import Optional, Union, BinaryIO, Tuple
import base64
import io

# Setup logging
logger = logging.getLogger(__name__)

class SpeechToText:
    """Class for converting speech to text"""
    
    def __init__(self):
        self.initialized = False
    
    def initialize(self) -> bool:
        """Initialize the speech recognition system"""
        try:
            # Check for required dependencies
            import speech_recognition
            self.recognizer = speech_recognition.Recognizer()
            self.initialized = True
            logger.info("Speech recognition system initialized")
            return True
        except ImportError:
            logger.warning("speech_recognition package not found. Install with: pip install SpeechRecognition")
            return False
    
    def audio_to_text(self, audio_data: Union[bytes, str, BinaryIO], language: str = "en-US") -> Tuple[bool, str]:
        """
        Convert audio data to text.
        
        Args:
            audio_data: Audio data as bytes, file path, or file-like object
            language: Language code (default: en-US)
            
        Returns:
            Tuple of (success, text or error message)
        """
        if not self.initialized and not self.initialize():
            return False, "Speech recognition system not initialized"
        
        import speech_recognition as sr
        
        try:
            # Convert audio to AudioData object
            audio = None
            
            # Handle different input types
            if isinstance(audio_data, bytes):
                # Save bytes to a temporary file
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                    temp_file.write(audio_data)
                    temp_path = temp_file.name
                
                try:
                    with sr.AudioFile(temp_path) as source:
                        audio = self.recognizer.record(source)
                finally:
                    # Clean up temporary file
                    os.unlink(temp_path)
                    
            elif isinstance(audio_data, str):
                # Assume it's a file path
                with sr.AudioFile(audio_data) as source:
                    audio = self.recognizer.record(source)
                    
            elif hasattr(audio_data, 'read'):
                # File-like object
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                    temp_file.write(audio_data.read())
                    temp_path = temp_file.name
                    
                try:
                    with sr.AudioFile(temp_path) as source:
                        audio = self.recognizer.record(source)
                finally:
                    # Clean up temporary file
                    os.unlink(temp_path)
                    
            else:
                return False, "Unsupported audio data type"
                
            # Perform recognition
            try:
                text = self.recognizer.recognize_google(audio, language=language)
                return True, text
            except sr.UnknownValueError:
                return False, "Speech could not be understood"
            except sr.RequestError as e:
                return False, f"Could not request results from speech recognition service: {e}"
                
        except Exception as e:
            logger.error(f"Error in speech recognition: {e}")
            return False, f"Error processing audio: {str(e)}"
            
    def recognize_from_microphone(self, duration: int = 5, language: str = "en-US") -> Tuple[bool, str]:
        """
        Recognize speech from microphone.
        
        Args:
            duration: Recording duration in seconds
            language: Language code
            
        Returns:
            Tuple of (success, text or error message)
        """
        if not self.initialized and not self.initialize():
            return False, "Speech recognition system not initialized"
            
        import speech_recognition as sr
        
        try:
            with sr.Microphone() as source:
                logger.info(f"Listening for {duration} seconds...")
                self.recognizer.adjust_for_ambient_noise(source)
                audio = self.recognizer.listen(source, timeout=duration)
                
            try:
                text = self.recognizer.recognize_google(audio, language=language)
                return True, text
            except sr.UnknownValueError:
                return False, "Speech could not be understood"
            except sr.RequestError as e:
                return False, f"Could not request results from speech recognition service: {e}"
                
        except Exception as e:
            logger.error(f"Error in speech recognition: {e}")
            return False, f"Error processing audio: {str(e)}"

class TextToSpeech:
    """Class for converting text to speech"""
    
    def __init__(self):
        self.initialized = False
        self.engine = None
        
    def initialize(self) -> bool:
        """Initialize the text-to-speech system"""
        try:
            # Try to use pyttsx3 for offline TTS
            import pyttsx3
            self.engine = pyttsx3.init()
            self.tts_type = "pyttsx3"
            self.initialized = True
            logger.info("Text-to-speech system initialized (pyttsx3)")
            return True
        except ImportError:
            try:
                # Fallback to gTTS (requires internet)
                from gtts import gTTS
                self.tts_type = "gtts"
                self.initialized = True
                logger.info("Text-to-speech system initialized (gTTS)")
                return True
            except ImportError:
                logger.warning("Neither pyttsx3 nor gTTS found. Install with: pip install pyttsx3 gtts")
                return False
                
    def text_to_speech(self, text: str, language: str = "en", output_path: Optional[str] = None) -> Tuple[bool, Union[str, bytes]]:
        """
        Convert text to speech.
        
        Args:
            text: Text to convert to speech
            language: Language code
            output_path: Optional path to save the audio file
            
        Returns:
            Tuple of (success, audio file path or audio data as bytes)
        """
        if not self.initialized and not self.initialize():
            return False, "Text-to-speech system not initialized"
            
        try:
            # Generate speech
            if self.tts_type == "pyttsx3":
                # Set properties
                self.engine.setProperty('rate', 150)  # Speed
                voices = self.engine.getProperty('voices')
                self.engine.setProperty('voice', voices[0].id)  # Default voice
                
                if output_path:
                    # Save to file
                    self.engine.save_to_file(text, output_path)
                    self.engine.runAndWait()
                    return True, output_path
                else:
                    # Save to bytes buffer
                    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
                        temp_path = temp_file.name
                        
                    self.engine.save_to_file(text, temp_path)
                    self.engine.runAndWait()
                    
                    with open(temp_path, 'rb') as f:
                        audio_data = f.read()
                        
                    os.unlink(temp_path)
                    return True, audio_data
                    
            else:  # gTTS
                from gtts import gTTS
                
                tts = gTTS(text=text, lang=language, slow=False)
                
                if output_path:
                    # Save to file
                    tts.save(output_path)
                    return True, output_path
                else:
                    # Save to bytes buffer
                    mp3_fp = io.BytesIO()
                    tts.write_to_fp(mp3_fp)
                    mp3_fp.seek(0)
                    return True, mp3_fp.read()
                    
        except Exception as e:
            logger.error(f"Error in text-to-speech: {e}")
            return False, f"Error generating speech: {str(e)}"
            
    def speak(self, text: str) -> bool:
        """
        Speak text immediately through speakers.
        
        Args:
            text: Text to speak
            
        Returns:
            Success flag
        """
        if not self.initialized and not self.initialize():
            return False
            
        try:
            if self.tts_type == "pyttsx3":
                self.engine.say(text)
                self.engine.runAndWait()
                return True
            else:
                # For gTTS, we need to save to a file and play it
                success, result = self.text_to_speech(text)
                if not success:
                    return False
                    
                # Play the audio using a platform-dependent method
                with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
                    temp_file.write(result)
                    temp_path = temp_file.name
                    
                try:
                    self._play_audio(temp_path)
                    return True
                finally:
                    os.unlink(temp_path)
                    
        except Exception as e:
            logger.error(f"Error in speak: {e}")
            return False
            
    def _play_audio(self, file_path: str) -> None:
        """Play audio file using platform-dependent method"""
        import platform
        system = platform.system()
        
        if system == "Windows":
            os.system(f"start {file_path}")
        elif system == "Darwin":  # macOS
            os.system(f"afplay {file_path}")
        else:  # Linux
            os.system(f"xdg-open {file_path}")

# Create singleton instances
speech_to_text = SpeechToText()
text_to_speech = TextToSpeech() 
