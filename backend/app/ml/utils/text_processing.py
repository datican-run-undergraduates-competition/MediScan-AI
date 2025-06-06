import logging
import re
from typing import List, Dict
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
    
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')
    
try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')

class TextProcessor:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))
        
    def preprocess_text(self, text: str) -> str:
        """
        Preprocess text for analysis.
        
        Args:
            text: Input text to preprocess
            
        Returns:
            Preprocessed text
        """
        try:
            # Convert to lowercase
            text = text.lower()
            
            # Remove special characters and numbers
            text = re.sub(r'[^a-zA-Z\s]', '', text)
            
            # Remove extra whitespace
            text = ' '.join(text.split())
            
            # Tokenize
            tokens = word_tokenize(text)
            
            # Remove stopwords and lemmatize
            tokens = [
                self.lemmatizer.lemmatize(token)
                for token in tokens
                if token not in self.stop_words
            ]
            
            # Join tokens back into text
            processed_text = ' '.join(tokens)
            
            return processed_text
            
        except Exception as e:
            self.logger.error(f"Error preprocessing text: {str(e)}")
            return text
            
    def postprocess_text(self, text: str) -> str:
        """
        Postprocess generated text for better readability.
        
        Args:
            text: Generated text to postprocess
            
        Returns:
            Postprocessed text
        """
        try:
            # Split into sentences
            sentences = sent_tokenize(text)
            
            # Capitalize first letter of each sentence
            sentences = [s.capitalize() for s in sentences]
            
            # Join sentences with proper spacing
            processed_text = ' '.join(sentences)
            
            # Fix common issues
            processed_text = self._fix_common_issues(processed_text)
            
            return processed_text
            
        except Exception as e:
            self.logger.error(f"Error postprocessing text: {str(e)}")
            return text
            
    def _fix_common_issues(self, text: str) -> str:
        """Fix common issues in generated text."""
        try:
            # Fix spacing around punctuation
            text = re.sub(r'\s+([.,!?])', r'\1', text)
            
            # Fix multiple spaces
            text = re.sub(r'\s+', ' ', text)
            
            # Fix spacing after punctuation
            text = re.sub(r'([.,!?])([a-zA-Z])', r'\1 \2', text)
            
            # Fix capitalization after punctuation
            text = re.sub(r'([.!?]\s+)([a-z])', lambda m: m.group(1) + m.group(2).upper(), text)
            
            return text
            
        except Exception as e:
            self.logger.error(f"Error fixing common issues: {str(e)}")
            return text
            
    def extract_key_phrases(self, text: str) -> List[str]:
        """
        Extract key phrases from text.
        
        Args:
            text: Input text
            
        Returns:
            List of key phrases
        """
        try:
            # Preprocess text
            processed_text = self.preprocess_text(text)
            
            # Tokenize into sentences
            sentences = sent_tokenize(processed_text)
            
            # Extract noun phrases (simple implementation)
            key_phrases = []
            for sentence in sentences:
                # Tokenize sentence
                tokens = word_tokenize(sentence)
                
                # Tag parts of speech
                tagged = nltk.pos_tag(tokens)
                
                # Extract noun phrases
                grammar = r"""
                    NP: {<DT>?<JJ>*<NN.*>+}
                """
                chunk_parser = nltk.RegexpParser(grammar)
                tree = chunk_parser.parse(tagged)
                
                # Extract phrases
                for subtree in tree.subtrees(filter=lambda t: t.label() == 'NP'):
                    phrase = ' '.join(word for word, tag in subtree.leaves())
                    key_phrases.append(phrase)
                    
            return key_phrases
            
        except Exception as e:
            self.logger.error(f"Error extracting key phrases: {str(e)}")
            return []
            
    def extract_medical_terms(self, text: str) -> List[str]:
        """
        Extract medical terms from text.
        
        Args:
            text: Input text
            
        Returns:
            List of medical terms
        """
        try:
            # Preprocess text
            processed_text = self.preprocess_text(text)
            
            # Tokenize
            tokens = word_tokenize(processed_text)
            
            # Extract medical terms (simple implementation)
            medical_terms = []
            for token in tokens:
                # Check if token is a medical term
                # This is a placeholder - in practice, you would use a medical dictionary
                if self._is_medical_term(token):
                    medical_terms.append(token)
                    
            return medical_terms
            
        except Exception as e:
            self.logger.error(f"Error extracting medical terms: {str(e)}")
            return []
            
    def _is_medical_term(self, term: str) -> bool:
        """Check if a term is a medical term."""
        # This is a placeholder - in practice, you would use a medical dictionary
        # For now, we'll just check if the term is longer than 5 characters
        return len(term) > 5
        
    def extract_symptoms(self, text: str) -> List[str]:
        """
        Extract symptoms from text.
        
        Args:
            text: Input text
            
        Returns:
            List of symptoms
        """
        try:
            # Preprocess text
            processed_text = self.preprocess_text(text)
            
            # Tokenize into sentences
            sentences = sent_tokenize(processed_text)
            
            # Extract symptoms (simple implementation)
            symptoms = []
            for sentence in sentences:
                # Check for symptom indicators
                if any(indicator in sentence.lower() for indicator in ['symptom', 'sign', 'complaint', 'experience']):
                    # Extract the symptom
                    symptom = self._extract_symptom(sentence)
                    if symptom:
                        symptoms.append(symptom)
                        
            return symptoms
            
        except Exception as e:
            self.logger.error(f"Error extracting symptoms: {str(e)}")
            return []
            
    def _extract_symptom(self, sentence: str) -> str:
        """Extract symptom from a sentence."""
        # This is a placeholder - in practice, you would use more sophisticated NLP
        # For now, we'll just return the sentence
        return sentence
        
    def extract_measurements(self, text: str) -> List[Dict]:
        """
        Extract measurements from text.
        
        Args:
            text: Input text
            
        Returns:
            List of measurements
        """
        try:
            # Preprocess text
            processed_text = self.preprocess_text(text)
            
            # Tokenize into sentences
            sentences = sent_tokenize(processed_text)
            
            # Extract measurements (simple implementation)
            measurements = []
            for sentence in sentences:
                # Check for measurement indicators
                if any(indicator in sentence.lower() for indicator in ['measure', 'reading', 'level', 'value']):
                    # Extract the measurement
                    measurement = self._extract_measurement(sentence)
                    if measurement:
                        measurements.append(measurement)
                        
            return measurements
            
        except Exception as e:
            self.logger.error(f"Error extracting measurements: {str(e)}")
            return []
            
    def _extract_measurement(self, sentence: str) -> Dict:
        """Extract measurement from a sentence."""
        # This is a placeholder - in practice, you would use more sophisticated NLP
        # For now, we'll just return a simple dictionary
        return {
            'value': 0,
            'unit': '',
            'type': ''
        }
        
    def extract_medications(self, text: str) -> List[str]:
        """
        Extract medications from text.
        
        Args:
            text: Input text
            
        Returns:
            List of medications
        """
        try:
            # Preprocess text
            processed_text = self.preprocess_text(text)
            
            # Tokenize into sentences
            sentences = sent_tokenize(processed_text)
            
            # Extract medications (simple implementation)
            medications = []
            for sentence in sentences:
                # Check for medication indicators
                if any(indicator in sentence.lower() for indicator in ['medication', 'drug', 'prescription', 'medicine']):
                    # Extract the medication
                    medication = self._extract_medication(sentence)
                    if medication:
                        medications.append(medication)
                        
            return medications
            
        except Exception as e:
            self.logger.error(f"Error extracting medications: {str(e)}")
            return []
            
    def _extract_medication(self, sentence: str) -> str:
        """Extract medication from a sentence."""
        # This is a placeholder - in practice, you would use more sophisticated NLP
        # For now, we'll just return the sentence
        return sentence
        
    def extract_treatments(self, text: str) -> List[str]:
        """
        Extract treatments from text.
        
        Args:
            text: Input text
            
        Returns:
            List of treatments
        """
        try:
            # Preprocess text
            processed_text = self.preprocess_text(text)
            
            # Tokenize into sentences
            sentences = sent_tokenize(processed_text)
            
            # Extract treatments (simple implementation)
            treatments = []
            for sentence in sentences:
                # Check for treatment indicators
                if any(indicator in sentence.lower() for indicator in ['treatment', 'therapy', 'procedure', 'intervention']):
                    # Extract the treatment
                    treatment = self._extract_treatment(sentence)
                    if treatment:
                        treatments.append(treatment)
                        
            return treatments
            
        except Exception as e:
            self.logger.error(f"Error extracting treatments: {str(e)}")
            return []
            
    def _extract_treatment(self, sentence: str) -> str:
        """Extract treatment from a sentence."""
        # This is a placeholder - in practice, you would use more sophisticated NLP
        # For now, we'll just return the sentence
        return sentence 