import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from .database import SessionLocal
from .tasks import process_pending_uploads
import logging

logger = logging.getLogger(__name__)

class UploadScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.is_running = False

    def start(self):
        """Start the scheduler"""
        if not self.is_running:
            # Add job to process pending uploads every 5 minutes
            self.scheduler.add_job(
                self._process_pending_uploads_job,
                trigger=IntervalTrigger(minutes=5),
                id="process_pending_uploads",
                replace_existing=True
            )
            
            self.scheduler.start()
            self.is_running = True
            logger.info("Upload scheduler started")

    def stop(self):
        """Stop the scheduler"""
        if self.is_running:
            self.scheduler.shutdown()
            self.is_running = False
            logger.info("Upload scheduler stopped")

    async def _process_pending_uploads_job(self):
        """Job to process pending uploads"""
        try:
            db = SessionLocal()
            try:
                await process_pending_uploads(db)
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Error in process_pending_uploads_job: {str(e)}")

# Create singleton instance
upload_scheduler = UploadScheduler() 