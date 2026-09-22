# MarketMind PowerShell Launcher
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  MARKETMIND — AI-Powered Indian Stock Market Intelligence" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n[1/3] Starting Python FastAPI Backend on Port 8000..." -ForegroundColor Yellow
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$rootDir\backend'; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000"

Write-Host "[2/3] Starting Next.js Web Frontend on Port 3000..." -ForegroundColor Yellow
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$rootDir\frontend'; npm run dev -- -p 3000"

Write-Host "[3/3] Waiting 4 seconds for services to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 4

Write-Host "`nOpening MarketMind in browser: http://localhost:3000" -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host "`nMarketMind is running!" -ForegroundColor Green
Write-Host "  - Frontend: http://localhost:3000"
Write-Host "  - API Swagger Docs: http://localhost:8000/docs"
