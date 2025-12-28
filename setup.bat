@echo off
REM Quick setup script for Windows

echo ========================================
echo Daigest Setup Script
echo ========================================
echo.

REM Backend setup
echo [1/4] Setting up backend...
cd backend

echo Creating virtual environment...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo [2/4] Creating .env file...
if not exist .env (
    copy ..\.env.development .env
    echo Created .env from template
    echo.
    echo ⚠️  IMPORTANT: Edit backend\.env and add your OPENAI_API_KEY
    echo.
) else (
    echo .env already exists, skipping...
)

echo.
echo [3/4] Initializing database...
python init_db.py --seed

echo.
echo [4/4] Setup complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Edit backend\.env and add your OPENAI_API_KEY
echo 2. Run start_backend.bat to start the backend
echo 3. Run start_frontend.bat to start the frontend
echo 4. Open http://localhost:3000 in your browser
echo.
pause
