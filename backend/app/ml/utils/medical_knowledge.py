import logging
from typing import Dict, List, Optional, Any
import json
from pathlib import Path
import os

logger = logging.getLogger(__name__)

class MedicalKnowledgeBase:
    def __init__(self, knowledge_base_dir: str = "app/ml/data/knowledge_base"):
        self.knowledge_base_dir = knowledge_base_dir
        self.diseases = {}
        self.medications = {}
        self.procedures = {}
        self.symptoms = {}
        self.anatomy = {}
        self.lab_tests = {}
        self.medical_terms = {}
        self._load_knowledge_base()

    def _load_knowledge_base(self) -> None:
        """Load all knowledge base files with robust error handling."""
        try:
            # Load each knowledge base file
            self.diseases = self._load_json_file("diseases.json")
            self.medications = self._load_json_file("medications.json")
            self.procedures = self._load_json_file("procedures.json")
            self.symptoms = self._load_json_file("symptoms.json")
            self.anatomy = self._load_json_file("anatomy.json")
            self.lab_tests = self._load_json_file("lab_tests.json")
            self.medical_terms = self._load_json_file("medical_terms.json")
        except Exception as e:
            logger.error(f"Error loading knowledge base: {str(e)}")
            # Initialize with empty dictionaries if loading fails
            self.diseases = {}
            self.medications = {}
            self.procedures = {}
            self.symptoms = {}
            self.anatomy = {}
            self.lab_tests = {}
            self.medical_terms = {}

    def _load_json_file(self, filename: str) -> Dict:
        """Load a JSON file with robust error handling."""
        try:
            file_path = os.path.join(self.knowledge_base_dir, filename)
            if not os.path.exists(file_path):
                logger.warning(f"Knowledge base file not found: {filename}")
                return {}

            # Read file in binary mode and handle null bytes
            with open(file_path, 'rb') as f:
                content = f.read()
                # Remove null bytes and decode
                content = content.replace(b'\x00', b'')
                # Clean any invalid characters
                content = content.decode('utf-8', errors='ignore')
                # Parse JSON
                return json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding JSON from {filename}: {str(e)}")
            return {}
        except Exception as e:
            logger.error(f"Error loading {filename}: {str(e)}")
            return {}

    def get_disease_info(self, disease_name: str) -> Optional[Dict]:
        """Get information about a specific disease."""
        return self.diseases.get(disease_name.lower())

    def get_medication_info(self, medication_name: str) -> Optional[Dict]:
        """Get information about a specific medication."""
        return self.medications.get(medication_name.lower())

    def get_procedure_info(self, procedure_name: str) -> Optional[Dict]:
        """Get information about a specific medical procedure."""
        return self.procedures.get(procedure_name.lower())

    def get_symptom_info(self, symptom_name: str) -> Optional[Dict]:
        """Get information about a specific symptom."""
        return self.symptoms.get(symptom_name.lower())

    def get_anatomy_info(self, anatomy_name: str) -> Optional[Dict]:
        """Get information about a specific anatomical structure."""
        return self.anatomy.get(anatomy_name.lower())

    def get_lab_test_info(self, test_name: str) -> Optional[Dict]:
        """Get information about a specific lab test."""
        return self.lab_tests.get(test_name.lower())

    def get_medical_term_info(self, term: str) -> Optional[Dict]:
        """Get information about a specific medical term."""
        return self.medical_terms.get(term.lower())

    def search_knowledge_base(self, query: str) -> Dict[str, List[Dict]]:
        """Search across all knowledge bases for a query."""
        query = query.lower()
        results = {
            "diseases": [],
            "medications": [],
            "procedures": [],
            "symptoms": [],
            "anatomy": [],
            "lab_tests": [],
            "medical_terms": []
        }

        # Search in each knowledge base
        for name, info in self.diseases.items():
            if query in name.lower() or query in info.get("description", "").lower():
                results["diseases"].append({"name": name, **info})

        for name, info in self.medications.items():
            if query in name.lower() or query in info.get("description", "").lower():
                results["medications"].append({"name": name, **info})

        for name, info in self.procedures.items():
            if query in name.lower() or query in info.get("description", "").lower():
                results["procedures"].append({"name": name, **info})

        for name, info in self.symptoms.items():
            if query in name.lower() or query in info.get("description", "").lower():
                results["symptoms"].append({"name": name, **info})

        for name, info in self.anatomy.items():
            if query in name.lower() or query in info.get("description", "").lower():
                results["anatomy"].append({"name": name, **info})

        for name, info in self.lab_tests.items():
            if query in name.lower() or query in info.get("description", "").lower():
                results["lab_tests"].append({"name": name, **info})

        for name, info in self.medical_terms.items():
            if query in name.lower() or query in info.get("description", "").lower():
                results["medical_terms"].append({"name": name, **info})

        return results
