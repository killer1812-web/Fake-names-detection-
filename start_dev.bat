@echo off
echo =================================================================
echo  Starting Fake Name & Synthetic Identity Analytics System
echo =================================================================

start "Identity Analytics Backend" cmd /k "cd backend && call .venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
start "Identity Analytics Frontend" cmd /k "cd frontend && npm run dev"

echo Backend starting on http://127.0.0.1:8000
echo Frontend starting on http://localhost:5173
echo Swagger Docs: http://127.0.0.1:8000/docs
echo =================================================================
pause
