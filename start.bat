@echo off
echo Starting Sawari Application...
echo.
echo Starting Backend Server...
start cmd /k "cd server && npm start"
timeout /t 3 /nobreak >nul
echo.
echo Starting Frontend Server...
start cmd /k "npm run dev"
echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
pause

