import logging
from typing import Dict, List, Optional
import json
from pathlib import Path

class MedicalKnowledgeBase:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.knowledge_base = {}
        self.conditions_db = {}
        self.treatments_db = {}
        self.medications_db = {}
        
        # Initialize knowledge bases
        self._initialize_knowledge_bases()
        
    def _initialize_knowledge_bases(self):
        """Initialize medical knowledge bases from files."""
        try:
            # Load conditions database
            conditions_path = Path(__file__).parent / 'data' / 'conditions.json'
            if conditions_path.exists():
                with open(conditions_path, 'r') as f:
                    self.conditions_db = json.load(f)
                    
            # Load treatments database
            treatments_path = Path(__file__).parent / 'data' / 'treatments.json'
            if treatments_path.exists():
                with open(treatments_path, 'r') as f:
                    self.treatments_db = json.load(f)
                    
            # Load medications database
            medications_path = Path(__file__).parent / 'data' / 'medications.json'
            if medications_path.exists():
                with open(medications_path, 'r') as f:
                    self.medications_db = json.load(f)
                    
            self.logger.info("Successfully initialized medical knowledge bases")
        except Exception as e:
            self.logger.error(f"Error initializing knowledge bases: {str(e)}")
            raise
            
    def get_condition_info(self, condition: str) -> Dict:
        """Get information about a medical condition."""
        try:
            return self.conditions_db.get(condition, {})
        except Exception as e:
            self.logger.error(f"Error getting condition info: {str(e)}")
            return {}
            
    def get_treatment_info(self, treatment: str) -> Dict:
        """Get information about a medical treatment."""
        try:
            return self.treatments_db.get(treatment, {})
        except Exception as e:
            self.logger.error(f"Error getting treatment info: {str(e)}")
            return {}
            
    def get_medication_info(self, medication: str) -> Dict:
        """Get information about a medication."""
        try:
            return self.medications_db.get(medication, {})
        except Exception as e:
            self.logger.error(f"Error getting medication info: {str(e)}")
            return {}
            
    def get_related_conditions(self, condition: str) -> List[str]:
        """Get list of conditions related to the given condition."""
        try:
            condition_info = self.get_condition_info(condition)
            return condition_info.get('related_conditions', [])
        except Exception as e:
            self.logger.error(f"Error getting related conditions: {str(e)}")
            return []
            
    def get_common_treatments(self, condition: str) -> List[str]:
        """Get list of common treatments for a condition."""
        try:
            condition_info = self.get_condition_info(condition)
            return condition_info.get('common_treatments', [])
        except Exception as e:
            self.logger.error(f"Error getting common treatments: {str(e)}")
            return []
            
    def get_common_medications(self, condition: str) -> List[str]:
        """Get list of common medications for a condition."""
        try:
            condition_info = self.get_condition_info(condition)
            return condition_info.get('common_medications', [])
        except Exception as e:
            self.logger.error(f"Error getting common medications: {str(e)}")
            return []
            
    def get_symptoms(self, condition: str) -> List[str]:
        """Get list of symptoms for a condition."""
        try:
            condition_info = self.get_condition_info(condition)
            return condition_info.get('symptoms', [])
        except Exception as e:
            self.logger.error(f"Error getting symptoms: {str(e)}")
            return []
            
    def get_risk_factors(self, condition: str) -> List[str]:
        """Get list of risk factors for a condition."""
        try:
            condition_info = self.get_condition_info(condition)
            return condition_info.get('risk_factors', [])
        except Exception as e:
            self.logger.error(f"Error getting risk factors: {str(e)}")
            return []
            
    def get_prevention_methods(self, condition: str) -> List[str]:
        """Get list of prevention methods for a condition."""
        try:
            condition_info = self.get_condition_info(condition)
            return condition_info.get('prevention_methods', [])
        except Exception as e:
            self.logger.error(f"Error getting prevention methods: {str(e)}")
            return []
            
    def get_lifestyle_recommendations(self, condition: str) -> List[str]:
        """Get list of lifestyle recommendations for a condition."""
        try:
            condition_info = self.get_condition_info(condition)
            return condition_info.get('lifestyle_recommendations', [])
        except Exception as e:
            self.logger.error(f"Error getting lifestyle recommendations: {str(e)}")
            return []
            
    def get_emergency_signs(self, condition: str) -> List[str]:
        """Get list of emergency signs for a condition."""
        try:
            condition_info = self.get_condition_info(condition)
            return condition_info.get('emergency_signs', [])
        except Exception as e:
            self.logger.error(f"Error getting emergency signs: {str(e)}")
            return []
            
    def get_follow_up_care(self, condition: str) -> List[str]:
        """Get list of follow-up care recommendations for a condition."""
        try:
            condition_info = self.get_condition_info(condition)
            return condition_info.get('follow_up_care', [])
        except Exception as e:
            self.logger.error(f"Error getting follow-up care: {str(e)}")
            return []
            
    def get_condition_summary(self, condition: str) -> str:
        """Get a summary of a condition."""
        try:
            condition_info = self.get_condition_info(condition)
            return condition_info.get('summary', '')
        except Exception as e:
            self.logger.error(f"Error getting condition summary: {str(e)}")
            return ''
            
    def get_treatment_summary(self, treatment: str) -> str:
        """Get a summary of a treatment."""
        try:
            treatment_info = self.get_treatment_info(treatment)
            return treatment_info.get('summary', '')
        except Exception as e:
            self.logger.error(f"Error getting treatment summary: {str(e)}")
            return ''
            
    def get_medication_summary(self, medication: str) -> str:
        """Get a summary of a medication."""
        try:
            medication_info = self.get_medication_info(medication)
            return medication_info.get('summary', '')
        except Exception as e:
            self.logger.error(f"Error getting medication summary: {str(e)}")
            return ''
            
    def get_side_effects(self, medication: str) -> List[str]:
        """Get list of side effects for a medication."""
        try:
            medication_info = self.get_medication_info(medication)
            return medication_info.get('side_effects', [])
        except Exception as e:
            self.logger.error(f"Error getting side effects: {str(e)}")
            return []
            
    def get_contraindications(self, medication: str) -> List[str]:
        """Get list of contraindications for a medication."""
        try:
            medication_info = self.get_medication_info(medication)
            return medication_info.get('contraindications', [])
        except Exception as e:
            self.logger.error(f"Error getting contraindications: {str(e)}")
            return []
            
    def get_dosage_info(self, medication: str) -> Dict:
        """Get dosage information for a medication."""
        try:
            medication_info = self.get_medication_info(medication)
            return medication_info.get('dosage', {})
        except Exception as e:
            self.logger.error(f"Error getting dosage info: {str(e)}")
            return {}
            
    def get_interactions(self, medication: str) -> List[str]:
        """Get list of drug interactions for a medication."""
        try:
            medication_info = self.get_medication_info(medication)
            return medication_info.get('interactions', [])
        except Exception as e:
            self.logger.error(f"Error getting interactions: {str(e)}")
            return []
            
    def get_treatment_steps(self, treatment: str) -> List[str]:
        """Get list of steps for a treatment."""
        try:
            treatment_info = self.get_treatment_info(treatment)
            return treatment_info.get('steps', [])
        except Exception as e:
            self.logger.error(f"Error getting treatment steps: {str(e)}")
            return []
            
    def get_treatment_risks(self, treatment: str) -> List[str]:
        """Get list of risks for a treatment."""
        try:
            treatment_info = self.get_treatment_info(treatment)
            return treatment_info.get('risks', [])
        except Exception as e:
            self.logger.error(f"Error getting treatment risks: {str(e)}")
            return []
            
    def get_treatment_benefits(self, treatment: str) -> List[str]:
        """Get list of benefits for a treatment."""
        try:
            treatment_info = self.get_treatment_info(treatment)
            return treatment_info.get('benefits', [])
        except Exception as e:
            self.logger.error(f"Error getting treatment benefits: {str(e)}")
            return []
            
    def get_treatment_alternatives(self, treatment: str) -> List[str]:
        """Get list of alternative treatments."""
        try:
            treatment_info = self.get_treatment_info(treatment)
            return treatment_info.get('alternatives', [])
        except Exception as e:
            self.logger.error(f"Error getting treatment alternatives: {str(e)}")
            return [] 