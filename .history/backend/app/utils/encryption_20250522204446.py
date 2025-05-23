import os
import base64
from typing import Union, Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from ..core.database import Base
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.types import TypeDecorator, VARCHAR
from sqlalchemy import event
import json

# Get encryption key from environment or generate one
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", None)
if not ENCRYPTION_KEY:
    # Generate a key and warn the user that this is temporary
    key = Fernet.generate_key()
    ENCRYPTION_KEY = base64.urlsafe_b64encode(key).decode()
    print("WARNING: No ENCRYPTION_KEY found. Using a temporary key (will not persist between restarts).")
    print("For production use, set ENCRYPTION_KEY in your environment or .env file.")

# Initialize Fernet cipher with the key
cipher = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)

def derive_key(password: str, salt: Optional[bytes] = None) -> tuple:
    """
    Derive an encryption key from a password and salt.
    Returns the key and the salt used (generated if not provided).
    """
    if salt is None:
        salt = os.urandom(16)
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    
    key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
    return key, salt

def encrypt_data(data: Union[str, bytes, dict]) -> bytes:
    """
    Encrypt string, bytes, or JSON-serializable data.
    Returns encrypted bytes.
    """
    if isinstance(data, dict):
        data = json.dumps(data).encode()
    elif isinstance(data, str):
        data = data.encode()
    
    return cipher.encrypt(data)

def decrypt_data(encrypted_data: bytes) -> bytes:
    """
    Decrypt encrypted bytes.
    Returns decrypted bytes.
    """
    return cipher.decrypt(encrypted_data)

def decrypt_to_string(encrypted_data: bytes) -> str:
    """
    Decrypt encrypted bytes to string.
    """
    return decrypt_data(encrypted_data).decode()

def decrypt_to_json(encrypted_data: bytes) -> dict:
    """
    Decrypt encrypted bytes to JSON.
    """
    return json.loads(decrypt_data(encrypted_data).decode())

class EncryptedType(TypeDecorator):
    """
    SQLAlchemy type for automatically encrypting and decrypting values.
    Use this as a column type for sensitive data.
    """
    impl = VARCHAR
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            if isinstance(value, dict):
                value = json.dumps(value)
            value = encrypt_data(value).decode()
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            value = decrypt_to_string(value.encode())
            try:
                # Try to parse as JSON if it looks like a JSON object
                if value.startswith('{') and value.endswith('}'):
                    return json.loads(value)
            except json.JSONDecodeError:
                pass
        return value

class EncryptedMixin:
    """
    Mixin to automatically encrypt specified fields in SQLAlchemy models.
    Add this to models containing sensitive data.
    
    Example: 
    class Patient(Base, EncryptedMixin):
        __tablename__ = "patients"
        __encrypted_fields__ = ["medical_history", "ssn"]
        
        id = Column(Integer, primary_key=True)
        name = Column(String)
        medical_history = Column(String)
        ssn = Column(String)
    """
    __encrypted_fields__ = []
    
    @declared_attr
    def __mapper_args__(cls):
        args = {}
        
        @event.listens_for(cls, 'before_insert')
        def before_insert(mapper, connection, target):
            for field in cls.__encrypted_fields__:
                value = getattr(target, field)
                if value is not None:
                    if isinstance(value, dict):
                        value = json.dumps(value)
                    encrypted = encrypt_data(value).decode()
                    setattr(target, field, encrypted)
        
        @event.listens_for(cls, 'before_update')
        def before_update(mapper, connection, target):
            for field in cls.__encrypted_fields__:
                value = getattr(target, field)
                if value is not None and not value.startswith('g'):  # Simple heuristic to check if already encrypted
                    if isinstance(value, dict):
                        value = json.dumps(value)
                    encrypted = encrypt_data(value).decode()
                    setattr(target, field, encrypted)
        
        @event.listens_for(cls, 'after_load')
        def after_load(target, context):
            for field in cls.__encrypted_fields__:
                value = getattr(target, field)
                if value is not None:
                    try:
                        decrypted = decrypt_to_string(value.encode())
                        # Try to parse JSON
                        try:
                            if decrypted.startswith('{') and decrypted.endswith('}'):
                                decrypted = json.loads(decrypted)
                        except json.JSONDecodeError:
                            pass
                        setattr(target, field, decrypted)
                    except Exception:
                        # Field might not be encrypted yet
                        pass
        
        return args 
