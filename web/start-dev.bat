@echo off
echo Starting development servers...
start "API Server" cmd /k "node server/index.mjs"
timeout /t 2 /nobreak > nul
start "Vite Server" cmd /k "npm run dev:web"
echo Both servers started. Check the opened windows.
pause
