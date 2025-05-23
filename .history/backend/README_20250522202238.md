# MediScan AI Backend

This directory contains the backend code for the MediScan AI application.

## Technologies Used
- FastAPI
- SQLAlchemy ORM
- PyTorch/TensorFlow for ML models
- MONAI for medical image processing
- Transformers for NLP

## Getting Started

```bash
# Install dependencies
pip install -r ../requirements.txt

# Run development server
python ../run.py
```

## Directory Structure
- `app/`: Main application code
  - `api/`: API endpoints
    - `routes/`: Route handlers
  - `core/`: Core functionality (database, security)
  - `models/`: Database models
  - `schemas/`: Pydantic schemas
  - `utils/`: Utility functions
- `tests/`: Unit and integration tests 
