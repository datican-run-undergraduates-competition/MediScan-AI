import os
import json
import logging
from typing import Dict, List, Optional, Union
from pathlib import Path
from datetime import datetime

class BaseIntegrationManager:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.config = self._load_config()
        self.active_sessions = {}
    
    def _load_config(self) -> Dict:
        """Load integration configuration"""
        try:
            config_path = Path(__file__).parent.parent / 'config' / 'integration_config.json'
            with open(config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            self.logger.error(f"Error loading config: {e}")
            return {}
    
    def _initialize_session(self, session_id: str):
        """Initialize a new analysis session"""
        self.active_sessions[session_id] = {
            'start_time': datetime.now(),
            'status': 'processing',
            'results': None
        }
    
    def _update_session(self, session_id: str, report: Dict):
        """Update session with analysis results"""
        if session_id in self.active_sessions:
            self.active_sessions[session_id].update({
                'status': 'completed',
                'results': report,
                'end_time': datetime.now()
            })
    
    def get_session_status(self, session_id: str) -> Dict:
        """Get status of analysis session"""
        return self.active_sessions.get(session_id, {})
    
    def clear_session(self, session_id: str):
        """Clear analysis session"""
        if session_id in self.active_sessions:
            del self.active_sessions[session_id] 