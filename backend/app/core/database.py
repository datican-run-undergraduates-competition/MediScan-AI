import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import logging
from typing import Generator

# Load environment variables
try:
    load_dotenv()
except Exception as e:
    logging.warning(f"Failed to load .env file: {e}")

# Database URL configuration - Using SQLite for local development
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite:///./ai_med_system.db"
)

# SQLAlchemy engine configuration
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    echo=False
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy models
Base = declarative_base()

# Setup logging
logger = logging.getLogger(__name__)

def get_db() -> Generator:
    """
    Get a database session.
    Yields a SQLAlchemy session and ensures it is closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def init_db() -> None:
    """
    Initialize the database.
    Creates all tables in the database.
    """
    # Import all models to ensure they are registered with SQLAlchemy
    from ..models.user import User, SecurityLog
    # Create all tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully")

def check_connection() -> bool:
    """
    Check the database connection.
    Returns True if the connection is successful, False otherwise.
    """
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        return False 
