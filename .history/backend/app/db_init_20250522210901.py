import logging
import os
from .core.database import init_db, check_connection, engine, Base
from .models.user import User, SecurityLog
from .core.security import get_password_hash
from sqlalchemy.orm import Session
from .core.database import SessionLocal
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_default_admin():
    """Create a default superuser if none exists"""
    db = SessionLocal()
    try:
        # Check if any superuser exists
        if db.query(User).filter(User.is_superuser == True).first():
            logger.info("Admin user already exists")
            return
        
        # Get credentials from environment or use defaults
        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        admin_password = os.getenv("ADMIN_PASSWORD", "Admin@123")
        admin_email = os.getenv("ADMIN_EMAIL", "admin@mediscanai.com")
        
        # Create admin user
        admin_user = User(
            username=admin_username,
            email=admin_email,
            hashed_password=get_password_hash(admin_password),
            full_name="System Administrator",
            is_active=True,
            is_superuser=True,
            is_verified=True,
            created_at=datetime.utcnow()
        )
        
        db.add(admin_user)
        db.commit()
        logger.info(f"Default admin user '{admin_username}' created")
        
        # Log admin creation as security event
        log = SecurityLog(
            user_id=admin_user.id,
            event_type="admin_created",
            ip_address="system",
            user_agent="system",
            details={"method": "automatic_initialization"}
        )
        db.add(log)
        db.commit()
        
    except Exception as e:
        logger.error(f"Error creating default admin: {e}")
        db.rollback()
    finally:
        db.close()

def init():
    """Initialize the database and create default data if needed"""
    try:
        if not check_connection():
            logger.error("Could not connect to database")
            return False
        
        # Create tables
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        
        # Create default admin
        logger.info("Creating default admin user if needed...")
        create_default_admin()
        
        logger.info("Database initialization complete")
        return True
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        return False

if __name__ == "__main__":
    init() 
