import logging
from app.db_init import init
from app.database import engine
from app.db.base import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_database():
    """Initialize the database with tables and default data."""
    try:
        # Create tables
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        
        # Initialize default data
        logger.info("Initializing default data...")
        if init():
            logger.info("Database initialization completed successfully")
        else:
            logger.error("Database initialization failed")
            
    except Exception as e:
        logger.error(f"Error during database initialization: {str(e)}")
        raise

if __name__ == "__main__":
    init_database() 