# PowerShell One-Command Launcher for Fake Name & Synthetic Identity Analytics System
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Starting Fake Name & Synthetic Identity Analytics System        " -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Cyan

$CurrentDir = Get-Location

# 1. Start Backend in a new window
Write-Host "[*] Launching Backend Server on http://127.0.0.1:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$CurrentDir\backend'; .\`.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

# 2. Start Frontend in a new window
Write-Host "[*] Launching Frontend Server on http://localhost:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$CurrentDir\frontend'; npm run dev"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "[+] System launched successfully!" -ForegroundColor Green
Write-Host "    - Frontend URL:   http://localhost:5173" -ForegroundColor White
Write-Host "    - API URL:        http://127.0.0.1:8000" -ForegroundColor White
Write-Host "    - Swagger Docs:   http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "=================================================================" -ForegroundColor Cyan
