import pydicom
import os
import logging
import tempfile
from typing import Dict, Any, Optional, List, Union
import io

# Set up logging
logger = logging.getLogger(__name__)

async def validate_dicom_file(file_path: str) -> bool:
    """
    Validate if a file is a valid DICOM file
    
    Args:
        file_path: Path to the file
        
    Returns:
        True if file is a valid DICOM file, False otherwise
    """
    try:
        # Try to read the file as DICOM
        dicom_data = pydicom.dcmread(file_path, force=False, stop_before_pixels=True)
        
        # Check if file has required DICOM attributes
        required_attributes = ['PatientID', 'StudyDate', 'Modality']
        for attr in required_attributes:
            if not hasattr(dicom_data, attr):
                logger.warning(f"DICOM file missing required attribute: {attr}")
                return False
        
        return True
    
    except Exception as e:
        logger.warning(f"Invalid DICOM file: {str(e)}")
        return False

async def extract_dicom_metadata(file_path: str) -> Dict[str, Any]:
    """
    Extract metadata from a DICOM file
    
    Args:
        file_path: Path to the DICOM file
        
    Returns:
        Dictionary containing DICOM metadata
    """
    try:
        # Read DICOM file but skip pixel data for performance
        dicom_data = pydicom.dcmread(file_path, stop_before_pixels=True)
        
        # Extract key metadata attributes
        metadata = {
            'patient_id': safe_get_attribute(dicom_data, 'PatientID'),
            'patient_name': safe_get_attribute(dicom_data, 'PatientName'),
            'patient_birth_date': safe_get_attribute(dicom_data, 'PatientBirthDate'),
            'patient_sex': safe_get_attribute(dicom_data, 'PatientSex'),
            'study_date': safe_get_attribute(dicom_data, 'StudyDate'),
            'study_time': safe_get_attribute(dicom_data, 'StudyTime'),
            'study_description': safe_get_attribute(dicom_data, 'StudyDescription'),
            'modality': safe_get_attribute(dicom_data, 'Modality'),
            'manufacturer': safe_get_attribute(dicom_data, 'Manufacturer'),
            'institution_name': safe_get_attribute(dicom_data, 'InstitutionName'),
            'body_part_examined': safe_get_attribute(dicom_data, 'BodyPartExamined'),
            'pixel_spacing': safe_get_attribute(dicom_data, 'PixelSpacing'),
            'rows': safe_get_attribute(dicom_data, 'Rows'),
            'columns': safe_get_attribute(dicom_data, 'Columns'),
            'bits_allocated': safe_get_attribute(dicom_data, 'BitsAllocated'),
            'image_orientation': safe_get_attribute(dicom_data, 'ImageOrientationPatient'),
            'image_position': safe_get_attribute(dicom_data, 'ImagePositionPatient'),
            'window_center': safe_get_attribute(dicom_data, 'WindowCenter'),
            'window_width': safe_get_attribute(dicom_data, 'WindowWidth'),
            'has_pixel_data': hasattr(dicom_data, 'PixelData')
        }
        
        return metadata
    
    except Exception as e:
        logger.error(f"Error extracting DICOM metadata: {str(e)}")
        raise

def safe_get_attribute(dicom_data: pydicom.dataset.FileDataset, attribute: str) -> Union[str, int, float, None]:
    """
    Safely get an attribute from a DICOM dataset
    
    Args:
        dicom_data: DICOM dataset
        attribute: Attribute name
        
    Returns:
        Attribute value or None if not found
    """
    try:
        if hasattr(dicom_data, attribute):
            value = getattr(dicom_data, attribute)
            
            # Convert to string for certain complex types
            if attribute in ['PatientName']:
                return str(value)
            
            # Convert sequences or arrays to strings
            if hasattr(value, '__iter__') and not isinstance(value, (str, bytes)):
                return str(value)
            
            return value
        return None
    except Exception:
        return None

async def anonymize_dicom(file_path: str) -> str:
    """
    Anonymize a DICOM file
    
    Args:
        file_path: Path to the DICOM file
        
    Returns:
        Path to the anonymized DICOM file
    """
    try:
        # Read the DICOM file
        dicom_data = pydicom.dcmread(file_path)
        
        # Define tags to anonymize
        # List of tags based on DICOM standard PS3.15 Annex E (Basic Profile)
        tags_to_anonymize = [
            # Patient identifiers
            'PatientName',
            'PatientID',
            'PatientBirthDate',
            'PatientSex',
            'PatientAge',
            'PatientAddress',
            'PatientTelephoneNumbers',
            'OtherPatientIDs',
            'OtherPatientNames',
            'OtherPatientIDsSequence',
            
            # Physician information
            'ReferringPhysicianName',
            'ReferringPhysicianAddress',
            'ReferringPhysicianTelephoneNumbers',
            'NameOfPhysiciansReadingStudy',
            'PhysiciansOfRecord',
            'PerformingPhysicianName',
            'RequestingPhysician',
            
            # Study information
            'AccessionNumber',
            'StudyID',
            'InstanceCreatorUID',
            
            # Institution information
            'InstitutionName',
            'InstitutionAddress',
            'InstitutionalDepartmentName',
            
            # Request attributes
            'RequestAttributesSequence',
            
            # Image comments that might contain PHI
            'ImageComments',
            'AdditionalPatientHistory',
            
            # Curve data
            'CurveData',
            
            # Overlay data
            'OverlayData'
        ]
        
        # Anonymize identified tags
        for tag in tags_to_anonymize:
            if hasattr(dicom_data, tag):
                if tag == 'PatientName':
                    dicom_data.PatientName = 'ANONYMOUS'
                elif tag == 'PatientID':
                    dicom_data.PatientID = 'ID_REMOVED'
                elif tag == 'PatientBirthDate':
                    dicom_data.PatientBirthDate = '19000101'
                elif tag == 'PatientSex':
                    dicom_data.PatientSex = 'O'  # Other
                elif tag == 'PatientAge':
                    dicom_data.PatientAge = '000Y'
                else:
                    # Default handling for other tags
                    try:
                        delattr(dicom_data, tag)
                    except:
                        # If can't delete, try to set to empty value based on VR
                        try:
                            setattr(dicom_data, tag, '')
                        except:
                            pass
        
        # Generate a temporary file for the anonymized DICOM
        with tempfile.NamedTemporaryFile(delete=False, suffix='.dcm') as temp_file:
            temp_path = temp_file.name
        
        # Save the anonymized DICOM
        dicom_data.save_as(temp_path)
        
        return temp_path
    
    except Exception as e:
        logger.error(f"Error anonymizing DICOM file: {str(e)}")
        raise 
