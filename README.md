# AI Medical System

A modern medical imaging analysis system with AI capabilities, built with Next.js, TypeScript, and FastAPI.

## Features

- Modern, responsive UI inspired by Apple and GTA 6 designs
- Real-time medical image analysis (X-ray, MRI, CT)
- Secure authentication and authorization
- Voice assistant integration
- Real-time notifications
- Dark mode with glass-morphism effects
- Responsive dashboard with statistics
- File upload with drag-and-drop
- Progress tracking and status updates

## Tech Stack

### Frontend
- Next.js 14
- TypeScript
- Material-UI
- Framer Motion
- React Query
- Axios
- TailwindCSS

### Backend
- FastAPI
- PostgreSQL
- SQLAlchemy
- JWT Authentication
- Alembic
- Python 3.8+

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+
- PostgreSQL
- CUDA-capable GPU (optional, for faster processing)

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_medical_system
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
UPLOAD_DIR=uploads
LOG_LEVEL=INFO

# HuggingFace settings (required for using real models)
HF_TOKEN=your_huggingface_token_here
HF_XRAY_MODEL=mediscan/xray-specialized-vit
HF_MRI_MODEL=mediscan/mri-specialized-vit
HF_CT_MODEL=mediscan/ct-specialized-vit

# Set to True to use mock models instead of real models
USE_MOCK_MODELS=False
```

5. Initialize the database:
```bash
python init_db.py
```

6. Start the backend server:
```bash
python run.py
```

The API will be available at `http://localhost:8000`

## Development

### Frontend Development

- Uses Next.js App Router
- TypeScript for type safety
- Material-UI components with custom theme
- Framer Motion for animations
- React Query for data fetching
- TailwindCSS for utility classes

### Backend Development

- FastAPI for high-performance API
- SQLAlchemy for database operations
- JWT for authentication
- Alembic for database migrations
- Pydantic for data validation

## Deployment

### Frontend Deployment

1. Build the application:
```bash
cd frontend
npm run build
```

2. Start the production server:
```bash
npm start
```

### Backend Deployment

1. Set up a production database
2. Update environment variables
3. Run migrations:
```bash
alembic upgrade head
```

4. Start the production server:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Copyright Notice
© 2024 Genovo Technologies. All Rights Reserved.
Developed by Afolabi Oluwatosin for Genovo Technologies.

This software and its documentation are proprietary and confidential. Unauthorized copying, distribution, or use of this software, via any medium, is strictly prohibited.

## Author Information
- **Developer:** Afolabi Oluwatosin
- **Company:** Genovo Technologies
- **Project:** MediScan AI (Competition Submission)
- **Development Date:** June 2024
- **Copyright Registration:** Pending
- **Unique Identifier:** GENOVO-MEDISCAN-2024-001

## Intellectual Property Protection
This software is protected under:
- Copyright Law
- Trade Secret Protection
- Intellectual Property Rights
- Competition Submission Rights

Any unauthorized use, reproduction, or distribution of this software or its contents is strictly prohibited and will result in legal action. This includes but is not limited to:
- Copying or modifying the source code
- Reverse engineering
- Creating derivative works
- Distributing the software
- Using the software for commercial purposes without explicit permission

## Overview

MediScan AI is a comprehensive medical diagnostic platform that combines advanced AI analysis of medical imaging with a complete medical management system. The platform consists of two main components:

1. **MediScan AI Core**: Advanced AI-powered diagnostic system for medical imaging analysis
2. **MediScan Management**: Auxiliary medical management system for patient records and workflow

## Key Features

### MediScan AI Core
- **Multi-modal Analysis**
  - X-ray, MRI, and CT scan processing
  - Advanced image segmentation and classification
  - Real-time processing capabilities
  - Support for DICOM and standard image formats

- **AI-Powered Diagnostics**
  - Early disease detection pipeline
  - Specialized models for:
    - Stroke detection
    - Tuberculosis screening
    - Cancer detection
    - Cardiovascular conditions
  - Confidence scoring and uncertainty estimation

- **Clinical Report Analysis**
  - Automated extraction of key clinical indicators
  - Integration with medical imaging findings
  - Support for multiple languages
  - Custom report generation

- **Explainable AI**
  - Heatmap visualizations
  - Attention mechanism visualization
  - Confidence scoring explanations
  - Clinical correlation highlighting

### MediScan Management
- **Patient Management**
  - Electronic Health Records (EHR)
  - Medical history tracking
  - Appointment scheduling
  - Prescription management

- **Workflow Optimization**
  - Automated task prioritization
  - Resource allocation
  - Queue management
  - Performance analytics

- **Integration Capabilities**
  - HL7 FHIR support
  - DICOM integration
  - Third-party system connectivity
  - API access

## Technology Stack

### Backend
- **AI Engine**
  - Python 3.9+
  - PyTorch 1.9.0
  - TensorFlow 2.x
  - MONAI for medical imaging
  - BioClinicalBERT for NLP
  - FastAPI for API endpoints

- **Management System**
  - Node.js
  - Express.js
  - MongoDB
  - Redis for caching

### Frontend
- React.js
- Material-UI
- D3.js for visualizations
- Progressive Web App capabilities

### Infrastructure
- Docker containerization
- Kubernetes orchestration
- AWS/GCP cloud support
- Offline-first architecture

## Installation

### Prerequisites
- Docker and Docker Compose
- Git
- Node.js 16+
- Python 3.9+

### Quick Start
```bash
# Clone the repository
git clone https://github.com/yourusername/mediscan-ai.git
cd mediscan-ai

# Start the application
./rebuild.sh
```

### Development Setup
```bash
# Set up Python environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
# Clean npm cache and node_modules
rm -rf node_modules package-lock.json
npm cache clean --force
# Install dependencies
npm install --legacy-peer-deps
npm run build
```

## Usage

1. **Access the Platform**
   - Open `http://localhost:80` in your browser
   - Log in with your credentials

2. **Upload Medical Data**
   - Upload medical images (X-ray, MRI, CT scan)
   - Add clinical reports
   - Select target conditions for analysis

3. **Review Results**
   - View AI-generated diagnostic suggestions
   - Examine heatmap visualizations
   - Review confidence scores
   - Export comprehensive reports

## Model Architecture

### Image Processing Pipeline
1. **Preprocessing**
   - Image normalization
   - Artifact removal
   - Quality assessment

2. **Feature Extraction**
   - Vision transformers
   - Convolutional neural networks
   - Attention mechanisms

3. **Analysis**
   - Multi-modal fusion
   - Cross-attention mechanisms
   - Confidence scoring

### NLP Pipeline
1. **Text Processing**
   - Medical terminology recognition
   - Entity extraction
   - Relationship mapping

2. **Clinical Analysis**
   - Symptom identification
   - Risk factor assessment
   - Treatment recommendation

## Legal

### Terms of Use
By using this software, you agree to comply with all applicable laws and regulations. Unauthorized use, reproduction, or distribution of this software or its contents is prohibited.

### Privacy Policy
Our privacy policy outlines how we collect, use, and protect your data. Please review our privacy policy before using the system.

### Disclaimer
This software is provided "as is" without warranty of any kind. The authors and copyright holders are not liable for any damages arising from the use of this software.

## License
This software is proprietary and confidential. All rights are reserved. No part of this software may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of Genovo Technologies.

This software is submitted as a competition entry and is protected under intellectual property laws. Any unauthorized use, reproduction, or distribution of this software or its contents is strictly prohibited and may result in legal action.

### Enforcement
Genovo Technologies reserves the right to:
- Take legal action against any unauthorized use
- Seek injunctive relief
- Claim damages
- Pursue criminal charges where applicable

### Competition Rights
While this software is submitted for competition purposes:
- All intellectual property rights remain with Genovo Technologies
- Competition organizers are granted limited usage rights for evaluation only
- No transfer of ownership or rights is implied
- All code and documentation remain confidential

## Version History
- v1.0.0 (2024-03-20): Initial release
- v1.1.0 (2024-03-21): Added multi-modal analysis
- v1.2.0 (2024-03-22): Enhanced AI diagnostic capabilities

## Contact
For business inquiries:
- Email: business@genovotech.com
- Phone: +1 (555) 987-6543

---

© 2024 MediScan AI. All Rights Reserved.
Unauthorized copying, distribution, or use of this software, via any medium, is strictly prohibited.
