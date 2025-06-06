import logging
import os
from .core.database import init_db, check_connection, engine, Base
from .models.user import User, SecurityLog
from .core.security import get_password_hash
from sqlalchemy.orm import Session
from .core.database import SessionLocal
from datetime import datetime
from .models.models import UserSettings

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

def init_db(db: Session) -> None:
    """Initialize the database with default data."""
    try:
        # Create admin user if it doesn't exist
        admin = db.query(User).filter(User.email == "admin@mediscan.ai").first()
        if not admin:
            admin = User(
                email="admin@mediscan.ai",
                hashed_password=get_password_hash("Admin@123"),  # Change in production
                full_name="System Administrator",
                role="admin",
                department="IT",
                is_active=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            logger.info("Created admin user")

            # Create default settings for admin
            admin_settings = UserSettings(
                user_id=admin.id,
                notifications={
                    "email": True,
                    "push": True,
                    "analysis_complete": True,
                    "error_alerts": True
                },
                appearance={
                    "theme": "light",
                    "font_size": "medium",
                    "language": "en"
                },
                privacy={
                    "data_retention": 30,
                    "share_analytics": True,
                    "auto_delete": False
                }
            )
            db.add(admin_settings)
            db.commit()
            logger.info("Created admin settings")

    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise

def init() -> bool:
    """Initialize the database and return success status."""
    try:
        db = SessionLocal()
        init_db(db)
        db.close()
        return True
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        return False

if __name__ == "__main__":
    init() 
