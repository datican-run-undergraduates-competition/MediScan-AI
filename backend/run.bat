@echo off
echo Starting AI Medical System Backend...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed. Please install Python 3.11 or later.
    exit /b 1
)


REM Upgrade pip
python -m pip install --upgrade pip

REM Install requirements
echo Installing requirements...
pip install -r requirements.txt --no-cache-dir
if errorlevel 1 (
    echo Failed to install requirements
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_medical_system> .env
    echo SECRET_KEY=your-super-secret-key-change-in-production>> .env
    echo ALGORITHM=HS256>> .env
    echo ACCESS_TOKEN_EXPIRE_MINUTES=30>> .env
    echo UPLOAD_DIR=uploads>> .env
    echo LOG_LEVEL=INFO>> .env
)

REM Initialize database
echo Initializing database...
python init_db.py
if errorlevel 1 (
    echo Failed to initialize database
    exit /b 1
)

REM Start server
echo Starting server...
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause 