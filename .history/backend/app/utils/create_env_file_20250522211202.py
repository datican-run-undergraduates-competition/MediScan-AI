#!/usr/bin/env python3
"""
Script to generate a secure .env file with random keys
"""

import os
import secrets
import base64
from getpass import getpass
import argparse

def generate_secret_key(length=64):
    """Generate a secure random string for SECRET_KEY"""
    return secrets.token_urlsafe(length)

def generate_encryption_key():
    """Generate a secure random key for Fernet encryption"""
    return base64.urlsafe_b64encode(os.urandom(32)).decode()

def create_env_file(output_path=".env", admin_password=None, admin_email=None):
    """Create a new .env file with secure random keys"""
    # Get admin password if not provided
    if not admin_password:
        print("Please create an admin password.")
        print("It must be at least 8 characters and include uppercase, lowercase, numbers, and special chars.")
        admin_password = getpass("Admin password: ")

    # Get admin email if not provided
    if not admin_email:
        admin_email = input("Admin email (default: admin@example.com): ") or "admin@example.com"

    # Generate secure keys
    secret_key = generate_secret_key()
    encryption_key = generate_encryption_key()

    # Prepare environment content
    env_content = f"""# Security Settings
SECRET_KEY={secret_key}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ENCRYPTION_KEY={encryption_key}

# Database Configuration
DATABASE_URL=sqlite:///./mediscan_ai.db
# For PostgreSQL: postgresql://username:password@localhost:5432/mediscan_ai

# Admin User
ADMIN_USERNAME=admin
ADMIN_PASSWORD={admin_password}
ADMIN_EMAIL={admin_email}

# Rate Limiting
RATE_LIMIT_DURATION=60  # seconds
MAX_REQUESTS=30  # per RATE_LIMIT_DURATION

# CORS Settings (comma-separated list)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# Logging
LOG_LEVEL=INFO
"""

    # Write to file
    with open(output_path, "w") as f:
        f.write(env_content)
    
    print(f"Environment file created at {output_path}")
    print("IMPORTANT: Keep this file secure and never commit it to version control!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a secure .env file")
    parser.add_argument("--output", "-o", default=".env", help="Output file path")
    parser.add_argument("--password", "-p", help="Admin password (optional)")
    parser.add_argument("--email", "-e", help="Admin email (optional)")
    
    args = parser.parse_args()
    create_env_file(args.output, args.password, args.email) 
