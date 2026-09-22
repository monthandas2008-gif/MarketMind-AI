@echo off
title MarketMind Launcher
echo ============================================================
echo   MARKETMIND — AI-Powered Indian Stock Market Intelligence
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting Python FastAPI Backend (Port 8000)...
start "MarketMind Backend" cmd /k "cd backend && call venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"

echo [2/3] Starting Next.js Web Frontend (Port 3000)...
start "MarketMind Frontend" cmd /k "cd frontend && npm run dev -- -p 3000"

echo [3/3] Waiting 4 seconds for services to initialize...
timeout /t 4 /nobreak >nul

echo Opening MarketMind in default browser...
start http://localhost:3000

echo.
echo ============================================================
echo   MarketMind is running!
echo   - Web Dashboard: http://localhost:3000
echo   - Backend OpenAPI Docs: http://localhost:8000/docs
echo ============================================================
echo.
pause
