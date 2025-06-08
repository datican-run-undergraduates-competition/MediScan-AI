import os
import json
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def clean_file(file_path: str) -> None:
    """Clean a file of null bytes and invalid characters."""
    try:
        # Read file in binary mode
        with open(file_path, 'rb') as f:
            content = f.read()
        
        # Remove null bytes
        content = content.replace(b'\x00', b'')
        
        # Decode with error handling
        try:
            text = content.decode('utf-8')
        except UnicodeDecodeError:
            # If UTF-8 fails, try with latin-1
            text = content.decode('latin-1')
        
        # Clean any remaining invalid characters
        text = ''.join(char for char in text if ord(char) < 0x10000)
        
        # Parse and re-encode JSON to ensure valid format
        data = json.loads(text)
        cleaned_content = json.dumps(data, indent=2, ensure_ascii=False)
        
        # Write back to file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(cleaned_content)
            
        logger.info(f"Successfully cleaned {file_path}")
        
    except Exception as e:
        logger.error(f"Error cleaning {file_path}: {str(e)}")

def clean_knowledge_base():
    """Clean all knowledge base files."""
    # Get the knowledge base directory
    kb_dir = Path(__file__).parent.parent / "data" / "knowledge_base"
    
    # Clean each JSON file
    for file in kb_dir.glob("*.json"):
        clean_file(str(file))

if __name__ == "__main__":
    clean_knowledge_base() 