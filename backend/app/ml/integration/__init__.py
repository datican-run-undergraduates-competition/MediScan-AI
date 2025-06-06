from typing import Dict, Optional, Union
from .base_manager import BaseIntegrationManager
from .medical_case_processor import MedicalCaseProcessor
from .chatbot_integration import ChatbotIntegration

class IntegrationManager(BaseIntegrationManager):
    def __init__(self):
        super().__init__()
        
        # Initialize components
        self.medical_processor = MedicalCaseProcessor()
        self.chatbot = ChatbotIntegration()
    
    def process_medical_case(
        self,
        session_id: str,
        image_data: Union[str, bytes],
        clinical_notes: Optional[str] = None,
        dicom_metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Process a complete medical case with integrated analysis
        
        Args:
            session_id: Unique session identifier
            image_data: Medical image data (path or bytes)
            clinical_notes: Optional clinical notes
            dicom_metadata: Optional DICOM metadata
            
        Returns:
            Dictionary containing comprehensive analysis results
        """
        try:
            # Process medical case
            results = self.medical_processor.process_medical_case(
                session_id,
                image_data,
                clinical_notes,
                dicom_metadata
            )
            
            # Update session in both components
            self._update_session(session_id, results)
            self.chatbot._update_session(session_id, results)
            
            return results
            
        except Exception as e:
            self.logger.error(f"Error processing medical case: {e}")
            raise
    
    def get_chatbot_response(
        self,
        session_id: str,
        user_query: str
    ) -> Dict:
        """
        Get chatbot response based on analysis results
        
        Args:
            session_id: Session identifier
            user_query: User's question
            
        Returns:
            Dictionary containing chatbot response
        """
        try:
            return self.chatbot.get_chatbot_response(
                session_id,
                user_query
            )
        except Exception as e:
            self.logger.error(f"Error getting chatbot response: {e}")
            raise
    
    def get_session_status(self, session_id: str) -> Dict:
        """Get status of analysis session"""
        return self.medical_processor.get_session_status(session_id)
    
    def clear_session(self, session_id: str):
        """Clear analysis session"""
        self.medical_processor.clear_session(session_id)
        self.chatbot.clear_session(session_id) 