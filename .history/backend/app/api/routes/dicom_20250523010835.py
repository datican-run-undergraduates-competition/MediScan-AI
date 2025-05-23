from fastapi import APIRouter, UploadFile, File, Body, Depends, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
import pydicom
import tempfile
import shutil
import os
import logging
import uuid
from typing import Dict, Any, List, Optional
import io

from ...core.security import get_current_user
from ...models.user import User
from ...ml.image_processor import get_processor
from ...utils.audit_logger import log_event, LOG_CATEGORY, LOG_ACTION
from ...utils.dicom_utils import anonymize_dicom, extract_dicom_metadata, validate_dicom_file

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/dicom",
    tags=["DICOM Processing"],
    responses={404: {"description": "Not found"}}
)

@router.post("/upload")
async def upload_dicom_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    anonymize: bool = Body(False),
    study_type: str = Body("general"),
    current_user: User = Depends(get_current_user)
):
    """
    Upload and process a DICOM file
    
    Args:
        file: DICOM file to upload
        anonymize: Whether to anonymize the DICOM file
        study_type: Type of study (e.g., "xray", "ct", "mri")
        
    Returns:
        Processed DICOM metadata and file ID
    """
    try:
        # Create temp file to store the upload
        with tempfile.NamedTemporaryFile(delete=False, suffix=".dcm") as temp_file:
            # Save uploaded file to temp file
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name
        
        # Validate that this is a DICOM file
        if not await validate_dicom_file(temp_path):
            os.unlink(temp_path)  # Remove temp file
            raise HTTPException(status_code=400, detail="Invalid DICOM file")
        
        # Generate unique ID for this file
        file_id = str(uuid.uuid4())
        
        # Process the file (potentially in background)
        if anonymize:
            # Process in background to not block the request
            background_tasks.add_task(
                process_dicom, 
                temp_path, 
                file_id, 
                study_type, 
                current_user.id, 
                anonymize=True
            )
            
            # Log anonymization event
            log_event(
                category=LOG_CATEGORY.IMAGE_PROCESSING,
                action=LOG_ACTION.ANONYMIZE,
                user_id=current_user.id,
                details={"file_id": file_id, "study_type": study_type}
            )
            
            # Return response immediately
            return {
                "message": "DICOM file uploaded and queued for anonymization",
                "file_id": file_id,
                "status": "processing"
            }
        else:
            # Process immediately for small files
            metadata = await extract_dicom_metadata(temp_path)
            
            # Store the file in a permanent location (would use proper storage in production)
            storage_path = f"./storage/dicom/{file_id}.dcm"
            os.makedirs(os.path.dirname(storage_path), exist_ok=True)
            shutil.move(temp_path, storage_path)
            
            # Log upload event
            log_event(
                category=LOG_CATEGORY.IMAGE_PROCESSING,
                action=LOG_ACTION.UPLOAD,
                user_id=current_user.id,
                details={"file_id": file_id, "study_type": study_type, "metadata": metadata}
            )
            
            return {
                "message": "DICOM file processed successfully",
                "file_id": file_id,
                "metadata": metadata,
                "status": "completed"
            }
    
    except Exception as e:
        logger.error(f"Error processing DICOM file: {str(e)}")
        
        # Log error event
        log_event(
            category=LOG_CATEGORY.IMAGE_PROCESSING,
            action=LOG_ACTION.ERROR,
            user_id=current_user.id if current_user else None,
            details={"error": str(e), "filename": file.filename}
        )
        
        raise HTTPException(status_code=500, detail=f"Error processing DICOM file: {str(e)}")
    
    finally:
        # Close the file
        file.file.close()

@router.get("/metadata/{file_id}")
async def get_dicom_metadata(
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get metadata for a previously uploaded DICOM file
    
    Args:
        file_id: ID of the DICOM file
        
    Returns:
        DICOM metadata
    """
    try:
        # Check if file exists
        storage_path = f"./storage/dicom/{file_id}.dcm"
        if not os.path.exists(storage_path):
            raise HTTPException(status_code=404, detail="DICOM file not found")
        
        # Extract metadata
        metadata = await extract_dicom_metadata(storage_path)
        
        # Log access event
        log_event(
            category=LOG_CATEGORY.DATA_ACCESS,
            action=LOG_ACTION.VIEW,
            user_id=current_user.id,
            details={"file_id": file_id, "resource_type": "dicom_metadata"}
        )
        
        return metadata
    
    except Exception as e:
        logger.error(f"Error retrieving DICOM metadata: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving DICOM metadata: {str(e)}")

@router.post("/anonymize/{file_id}")
async def anonymize_dicom_file(
    background_tasks: BackgroundTasks,
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Anonymize a previously uploaded DICOM file
    
    Args:
        file_id: ID of the DICOM file to anonymize
        
    Returns:
        Status of the anonymization process
    """
    try:
        # Check if file exists
        storage_path = f"./storage/dicom/{file_id}.dcm"
        if not os.path.exists(storage_path):
            raise HTTPException(status_code=404, detail="DICOM file not found")
        
        # Generate new ID for anonymized file
        anon_file_id = str(uuid.uuid4())
        
        # Queue anonymization
        background_tasks.add_task(
            anonymize_dicom_file_task, 
            storage_path, 
            anon_file_id, 
            current_user.id
        )
        
        # Log anonymization request
        log_event(
            category=LOG_CATEGORY.IMAGE_PROCESSING,
            action=LOG_ACTION.ANONYMIZE,
            user_id=current_user.id,
            details={"source_file_id": file_id, "anonymized_file_id": anon_file_id}
        )
        
        return {
            "message": "DICOM file queued for anonymization",
            "original_file_id": file_id,
            "anonymized_file_id": anon_file_id,
            "status": "processing"
        }
    
    except Exception as e:
        logger.error(f"Error queueing DICOM anonymization: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error queueing DICOM anonymization: {str(e)}")

@router.get("/download/{file_id}")
async def download_dicom_file(
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Download a previously uploaded DICOM file
    
    Args:
        file_id: ID of the DICOM file
        
    Returns:
        DICOM file for download
    """
    try:
        # Check if file exists
        storage_path = f"./storage/dicom/{file_id}.dcm"
        if not os.path.exists(storage_path):
            raise HTTPException(status_code=404, detail="DICOM file not found")
        
        # Log download event
        log_event(
            category=LOG_CATEGORY.DATA_ACCESS,
            action=LOG_ACTION.DOWNLOAD,
            user_id=current_user.id,
            details={"file_id": file_id, "resource_type": "dicom_file"}
        )
        
        # Return file for download
        return FileResponse(
            path=storage_path, 
            filename=f"{file_id}.dcm", 
            media_type="application/dicom"
        )
    
    except Exception as e:
        logger.error(f"Error downloading DICOM file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error downloading DICOM file: {str(e)}")

@router.get("/status/{file_id}")
async def get_processing_status(
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get the processing status of a DICOM file
    
    Args:
        file_id: ID of the DICOM file
        
    Returns:
        Processing status
    """
    try:
        # Check if file exists in final storage
        storage_path = f"./storage/dicom/{file_id}.dcm"
        if os.path.exists(storage_path):
            return {"status": "completed", "file_id": file_id}
        
        # Check if file is in processing
        processing_path = f"./storage/processing/{file_id}.dcm"
        if os.path.exists(processing_path):
            return {"status": "processing", "file_id": file_id}
        
        # File not found
        raise HTTPException(status_code=404, detail="DICOM file not found")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking DICOM processing status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error checking DICOM processing status: {str(e)}")

# Background tasks
async def process_dicom(
    file_path: str, 
    file_id: str, 
    study_type: str,
    user_id: str,
    anonymize: bool = False
):
    """Process a DICOM file in the background"""
    try:
        # Create processing directory if it doesn't exist
        processing_dir = "./storage/processing"
        os.makedirs(processing_dir, exist_ok=True)
        
        # Move to processing directory
        processing_path = f"{processing_dir}/{file_id}.dcm"
        shutil.copy(file_path, processing_path)
        
        # Perform anonymization if requested
        if anonymize:
            anonymized_path = await anonymize_dicom(processing_path)
            if anonymized_path:
                os.remove(processing_path)  # Remove the original
                processing_path = anonymized_path
        
        # Create final storage directory if it doesn't exist
        storage_dir = "./storage/dicom"
        os.makedirs(storage_dir, exist_ok=True)
        
        # Move to final storage
        final_path = f"{storage_dir}/{file_id}.dcm"
        shutil.move(processing_path, final_path)
        
        # Clean up original file
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Log successful processing
        log_event(
            category=LOG_CATEGORY.IMAGE_PROCESSING,
            action=LOG_ACTION.PROCESS,
            user_id=user_id,
            details={
                "file_id": file_id, 
                "study_type": study_type,
                "anonymized": anonymize
            }
        )
        
    except Exception as e:
        logger.error(f"Error in background DICOM processing: {str(e)}")
        
        # Log error
        log_event(
            category=LOG_CATEGORY.IMAGE_PROCESSING,
            action=LOG_ACTION.ERROR,
            user_id=user_id,
            details={"file_id": file_id, "error": str(e)}
        )

async def anonymize_dicom_file_task(
    file_path: str,
    anon_file_id: str,
    user_id: str
):
    """Anonymize a DICOM file in the background"""
    try:
        # Create processing directory if it doesn't exist
        processing_dir = "./storage/processing"
        os.makedirs(processing_dir, exist_ok=True)
        
        # Copy to processing directory
        processing_path = f"{processing_dir}/{anon_file_id}.dcm"
        shutil.copy(file_path, processing_path)
        
        # Perform anonymization
        anonymized_path = await anonymize_dicom(processing_path)
        
        # Create final storage directory if it doesn't exist
        storage_dir = "./storage/dicom"
        os.makedirs(storage_dir, exist_ok=True)
        
        # Move to final storage
        final_path = f"{storage_dir}/{anon_file_id}.dcm"
        shutil.move(anonymized_path, final_path)
        
        # Clean up processing file
        if os.path.exists(processing_path):
            os.remove(processing_path)
        
        # Log successful anonymization
        log_event(
            category=LOG_CATEGORY.IMAGE_PROCESSING,
            action=LOG_ACTION.ANONYMIZE,
            user_id=user_id,
            details={"file_id": anon_file_id, "anonymized": True}
        )
        
    except Exception as e:
        logger.error(f"Error in background DICOM anonymization: {str(e)}")
        
        # Log error
        log_event(
            category=LOG_CATEGORY.IMAGE_PROCESSING,
            action=LOG_ACTION.ERROR,
            user_id=user_id,
            details={"file_id": anon_file_id, "error": str(e)}
        ) 
