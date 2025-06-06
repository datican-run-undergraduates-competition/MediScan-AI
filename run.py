import os
import sys
import subprocess
import time
import uvicorn
from pathlib import Path
import docker
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_docker():
    """Check if Docker is installed and running"""
    try:
        client = docker.from_env()
        client.ping()
        return True
    except:
        return False

def setup_docker_containers():
    """Set up MongoDB and Redis containers"""
    try:
        client = docker.from_env()
        
        # Check if containers already exist
        containers = client.containers.list(all=True)
        mongo_exists = any(c.name == 'aimed-mongodb' for c in containers)
        redis_exists = any(c.name == 'aimed-redis' for c in containers)
        
        # Start or create MongoDB container
        if not mongo_exists:
            logger.info("Starting MongoDB container...")
            client.containers.run(
                "mongo:4.4",
                name="aimed-mongodb",
                ports={'27017/tcp': 27017},
                detach=True,
                environment={"MONGO_INITDB_DATABASE": "aimed"}
            )
        else:
            container = client.containers.get('aimed-mongodb')
            if container.status != 'running':
                container.start()
        
        # Start or create Redis container
        if not redis_exists:
            logger.info("Starting Redis container...")
            client.containers.run(
                "redis:6",
                name="aimed-redis",
                ports={'6379/tcp': 6379},
                detach=True
            )
        else:
            container = client.containers.get('aimed-redis')
            if container.status != 'running':
                container.start()
                
        logger.info("Docker containers are ready!")
        return True
    except Exception as e:
        logger.error(f"Error setting up Docker containers: {str(e)}")
        return False

def setup_environment():
    """Set up environment variables and directories"""
    # Create .env file if it doesn't exist
    env_path = Path('.env')
    if not env_path.exists():
        logger.info("Creating .env file...")
        env_content = """# AI-Med System Environment Configuration
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/aimed
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secure-jwt-secret
HF_TOKEN=your-hugging-face-token
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
APP_NAME=AI-Med System
APP_URL=http://localhost:3000
"""
        env_path.write_text(env_content)
        logger.info("Created .env file. Please update it with your actual values.")

    # Create models directory
    models_dir = Path('backend/models')
    models_dir.mkdir(parents=True, exist_ok=True)
    
    # Create model subdirectories
    for model_type in ['xray_model', 'mri_model', 'ct_model']:
        (models_dir / model_type).mkdir(exist_ok=True)

def install_dependencies():
    """Install required Python packages"""
    logger.info("Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        logger.info("Dependencies installed successfully!")
    except subprocess.CalledProcessError as e:
        logger.error(f"Error installing dependencies: {str(e)}")
        return False
    return True

def download_models():
    """Download required models"""
    logger.info("Downloading models...")
    try:
        from transformers import AutoModelForImageClassification, AutoFeatureExtractor
        
        # Model IDs (replace with your actual model IDs)
        models = {
            'xray_model': 'microsoft/resnet-50',
            'mri_model': 'microsoft/resnet-50',
            'ct_model': 'microsoft/resnet-50'
        }
        
        for model_type, model_id in models.items():
            logger.info(f"Downloading {model_type}...")
            model = AutoModelForImageClassification.from_pretrained(model_id)
            feature_extractor = AutoFeatureExtractor.from_pretrained(model_id)
            
            # Save models
            model_path = f"backend/models/{model_type}"
            model.save_pretrained(model_path)
            feature_extractor.save_pretrained(model_path)
            
        logger.info("Models downloaded successfully!")
        return True
    except Exception as e:
        logger.error(f"Error downloading models: {str(e)}")
        return False

def main():
    """Main function to set up and run the application"""
    logger.info("Starting AI-Med System setup...")
    
    # Check Docker
    if not check_docker():
        logger.error("Docker is not installed or not running. Please install Docker and try again.")
        return
    
    # Setup environment
    setup_environment()
    
    # Setup Docker containers
    if not setup_docker_containers():
        logger.error("Failed to set up Docker containers")
        return
    
    # Install dependencies
    if not install_dependencies():
        logger.error("Failed to install dependencies")
        return
    
    # Download models
    if not download_models():
        logger.error("Failed to download models")
        return
    
    # Wait for services to be ready
    logger.info("Waiting for services to be ready...")
    time.sleep(5)
    
    # Run the application
    logger.info("Starting the application...")
    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=3000,
        reload=True
    )

if __name__ == "__main__":
    main() 
