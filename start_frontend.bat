@echo off
echo Starting Daigest Frontend...
echo.

cd frontend

echo Checking if node_modules exists...
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

echo.
echo Frontend starting on http://localhost:3001
echo.

set PORT=3001
call npm start
