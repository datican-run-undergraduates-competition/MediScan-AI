import os
import sys
from alembic.config import Config
from alembic import command
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def run_migrations():
    """Run database migrations."""
    try:
        # Get the path to the alembic.ini file
        alembic_cfg = Config("alembic.ini")
        
        # Run the migration
        command.upgrade(alembic_cfg, "head")
        print("Database migrations completed successfully.")
    except Exception as e:
        print(f"Error running migrations: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migrations() 