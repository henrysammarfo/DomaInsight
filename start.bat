@echo off
echo Starting DomaInsight - AI-Driven Domain Scoring & Predictive Analytics
echo.
echo This will start both the backend API server and frontend React app
echo.
echo Backend will run on: http://localhost:3001
echo Frontend will run on: http://localhost:3000
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js 16+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    npm install
    cd ..
)

REM Start both servers
echo Starting servers...
start "DomaInsight Backend" cmd /k "cd backend && npm start"
timeout /t 5 /nobreak >nul
start "DomaInsight Frontend" cmd /k "cd frontend && npm start"

echo.
echo ✅ DomaInsight is starting up!
echo.
echo Backend API: http://localhost:3000
echo Frontend App: http://localhost:3001
echo.
echo Press any key to open the frontend in your browser...
pause >nul

start http://localhost:3001

echo.
echo 🚀 DomaInsight is now running!
echo.
echo Features:
echo - AI Domain Scoring (0-100)
echo - Trend Analytics Dashboard  
echo - Actionable Recommendations
echo - Multi-chain Support
echo - Real-time Alerts
echo.
echo Press any key to exit...
pause >nul
