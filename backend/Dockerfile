FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies in stages with error handling
RUN pip install --no-cache-dir fastapi==0.68.1 uvicorn==0.15.0 python-multipart==0.0.5 || exit 1 && \
    pip install --no-cache-dir pillow==8.3.2 numpy==1.21.2 || exit 1 && \
    pip install --no-cache-dir scikit-learn==0.24.2 || exit 1 && \
    pip install --no-cache-dir torch==1.9.0 --index-url https://download.pytorch.org/whl/cpu || exit 1

# Copy source code
COPY . .

# Create health check endpoint with proper line endings
RUN printf "from flask import Flask\n\
app = Flask(__name__)\n\
@app.route(\"/health\")\n\
def health_check():\n\
    return {\"status\": \"healthy\"}, 200\n\
if __name__ == \"__main__\":\n\
    app.run(host=\"0.0.0.0\", port=3000)\n" > health_check.py

# Expose port
EXPOSE 3000

# Start the application
CMD ["python", "run.py"] 