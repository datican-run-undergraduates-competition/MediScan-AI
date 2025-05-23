#!/usr/bin/env python3
"""
JWT Token Generation Utility

This script generates JWT tokens for testing purposes.
"""

import os
import sys
import argparse
from datetime import datetime, timedelta
import json
import secrets
import base64
from typing import Dict, Optional

from jose import jwt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get settings from environment or use defaults
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

def generate_secret_key() -> str:
    """Generate a random secret key for JWT signing"""
    return secrets.token_hex(32)

def create_access_token(
    data: Dict,
    secret_key: Optional[str] = None,
    algorithm: str = ALGORITHM,
    expires_delta: Optional[timedelta] = None
) -> Dict:
    """
    Create a JWT token with the provided data.
    
    Args:
        data: The data to encode in the token
        secret_key: The secret key to sign the token (defaults to environment SECRET_KEY)
        algorithm: The algorithm to use for signing
        expires_delta: The expiration time delta
        
    Returns:
        Dict containing the token and expiration information
    """
    to_encode = data.copy()
    
    if not secret_key:
        secret_key = SECRET_KEY
        if not secret_key:
            secret_key = generate_secret_key()
            print(f"WARNING: No SECRET_KEY found in environment. Generated temporary key: {secret_key}")
    
    # Set expiration
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    
    # Create JWT token
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=algorithm)
    
    # Return token info
    return {
        "access_token": encoded_jwt,
        "token_type": "bearer",
        "expires_at": expire.isoformat(),
        "expires_in": int((expire - datetime.utcnow()).total_seconds())
    }

def decode_token(token: str, secret_key: Optional[str] = None, algorithm: str = ALGORITHM) -> Dict:
    """
    Decode a JWT token.
    
    Args:
        token: The token to decode
        secret_key: The secret key to verify the token (defaults to environment SECRET_KEY)
        algorithm: The algorithm used for verification
        
    Returns:
        The decoded token payload
    """
    if not secret_key:
        secret_key = SECRET_KEY
        if not secret_key:
            raise ValueError("No SECRET_KEY provided or found in environment")
            
    return jwt.decode(token, secret_key, algorithms=[algorithm])

def main():
    """Main entry point for CLI usage"""
    parser = argparse.ArgumentParser(description='Generate or decode JWT tokens')
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    # Generate token command
    gen_parser = subparsers.add_parser('generate', help='Generate a JWT token')
    gen_parser.add_argument('-u', '--username', default='test_user', help='Username for token')
    gen_parser.add_argument('-e', '--expiry', type=int, default=ACCESS_TOKEN_EXPIRE_MINUTES,
                            help='Expiration time in minutes')
    gen_parser.add_argument('-s', '--scopes', default='', help='Comma-separated list of scopes')
    gen_parser.add_argument('-c', '--claims', default='{}', help='Additional claims as JSON string')
    gen_parser.add_argument('-k', '--key', help='Secret key (defaults to environment SECRET_KEY)')
    
    # Decode token command
    decode_parser = subparsers.add_parser('decode', help='Decode a JWT token')
    decode_parser.add_argument('token', help='JWT token to decode')
    decode_parser.add_argument('-k', '--key', help='Secret key (defaults to environment SECRET_KEY)')
    
    # Generate key command
    subparsers.add_parser('genkey', help='Generate a new random secret key')
    
    args = parser.parse_args()
    
    if not args.command or args.command == 'genkey':
        # Generate a new secret key
        key = generate_secret_key()
        print(f"Generated secret key: {key}")
        print("\nYou can add this to your .env file:")
        print(f"SECRET_KEY={key}")
        return
    
    if args.command == 'generate':
        # Prepare token data
        try:
            additional_claims = json.loads(args.claims)
        except json.JSONDecodeError:
            print("Error: Invalid JSON in claims argument")
            sys.exit(1)
            
        # Create token data
        token_data = {
            "sub": args.username,
            **additional_claims
        }
        
        # Add scopes if provided
        if args.scopes:
            token_data["scopes"] = args.scopes.split(",")
            
        # Generate the token
        token_info = create_access_token(
            data=token_data, 
            secret_key=args.key, 
            expires_delta=timedelta(minutes=args.expiry)
        )
        
        # Print token info
        print("\nGenerated JWT Token:")
        print(f"Access Token: {token_info['access_token']}")
        print(f"Token Type: {token_info['token_type']}")
        print(f"Expires At: {token_info['expires_at']}")
        print(f"Expires In: {token_info['expires_in']} seconds")
        print("\nUse this token in Authorization header:")
        print(f"Authorization: Bearer {token_info['access_token']}")
        
    elif args.command == 'decode':
        try:
            # Decode the token
            payload = decode_token(args.token, args.key)
            print("\nDecoded JWT Token:")
            print(json.dumps(payload, indent=2))
        except Exception as e:
            print(f"Error decoding token: {e}")
            sys.exit(1)

if __name__ == "__main__":
    main() 
