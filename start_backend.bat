@echo off
echo Starting Daigest Backend...
echo.

cd backend
call venv\Scripts\activate.bat

echo Backend starting on http://127.0.0.1:8001
echo API Documentation: http://127.0.0.1:8001/docs
echo.

uvicorn src.main:app --reload --host 127.0.0.1 --port 8001
