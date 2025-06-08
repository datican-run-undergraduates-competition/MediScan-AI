import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import ProgrammingError
from dotenv import load_dotenv
from urllib.parse import quote_plus

# Load environment variables
load_dotenv()

# Get database connection details from environment variables
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'Abioye@16')  # Your specific password
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'ai_med_system')

# URL encode the password to handle special characters
ENCODED_PASSWORD = quote_plus(DB_PASSWORD)

# Create connection string for postgres database (without specific database)
POSTGRES_URL = f"postgresql://{DB_USER}:{ENCODED_PASSWORD}@{DB_HOST}:{DB_PORT}/postgres"

def create_database():
    """Create the database if it doesn't exist."""
    try:
        # Connect to postgres database
        engine = create_engine(POSTGRES_URL)
        with engine.connect() as conn:
            # Check if database exists
            result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname = '{DB_NAME}'"))
            if not result.scalar():
                # Create database
                conn.execute(text(f"CREATE DATABASE {DB_NAME}"))
                print(f"Database '{DB_NAME}' created successfully.")
            else:
                print(f"Database '{DB_NAME}' already exists.")
    except Exception as e:
        print(f"Error creating database: {e}")
        print("\nTroubleshooting steps:")
        print("1. Make sure PostgreSQL is running")
        print("2. Verify the password is correct")
        print("3. Check if PostgreSQL is running on port 5432")
        sys.exit(1)

if __name__ == "__main__":
    create_database() 