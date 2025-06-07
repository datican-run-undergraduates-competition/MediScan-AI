@echo off
REM Activate your virtual environment if needed
REM call venv\Scripts\activate

REM Initialize the database tables
python -c "from database import init_db; init_db()"

REM Start the backend server (adjust as needed for your backend framework)
uvicorn main:app --reload 