import asyncio
from typing import Dict
from sqlalchemy.orm import Session
from . import models, schemas
from .services.analysis import analysis_service
import logging

logger = logging.getLogger(__name__)

async def process_upload(upload_id: int, db: Session):
    """Process an upload asynchronously"""
    try:
        # Get upload record
        upload = db.query(models.Upload).filter(models.Upload.id == upload_id).first()
        if not upload:
            logger.error(f"Upload {upload_id} not found")
            return
        
        # Update status to processing
        upload.status = "processing"
        db.commit()
        
        # Process based on file type
        if upload.file_type in ["xray", "mri", "ct"]:
            analysis_result = await analysis_service.analyze_image(
                upload.file_path,
                upload.model_id
            )
        elif upload.file_type == "report":
            analysis_result = await analysis_service.analyze_report(upload.file_path)
        else:
            raise ValueError(f"Unsupported file type: {upload.file_type}")
        
        # Create analysis record
        analysis = models.Analysis(
            upload_id=upload.id,
            findings=analysis_result["findings"],
            recommendations=analysis_result["recommendations"],
            confidence_scores=analysis_result["confidence_scores"],
            processing_time=analysis_result["processing_time"]
        )
        db.add(analysis)
        
        # Update upload status
        upload.status = "completed"
        db.commit()
        
        logger.info(f"Successfully processed upload {upload_id}")
        
    except Exception as e:
        logger.error(f"Error processing upload {upload_id}: {str(e)}")
        # Update upload status to failed
        upload.status = "failed"
        db.commit()
        raise

async def process_pending_uploads(db: Session):
    """Process all pending uploads"""
    try:
        pending_uploads = db.query(models.Upload).filter(
            models.Upload.status == "pending"
        ).all()
        
        for upload in pending_uploads:
            await process_upload(upload.id, db)
            
    except Exception as e:
        logger.error(f"Error processing pending uploads: {str(e)}")
        raise 