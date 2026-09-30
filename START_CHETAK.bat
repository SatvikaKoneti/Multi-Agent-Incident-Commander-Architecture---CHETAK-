@echo off
title CHETAK - Multi-Agent Incident Commander
echo =======================================================================
echo    CHETAK: MULTI-AGENT INCIDENT COMMANDER (STATEMENT ID: PNG2)
echo    Detect. Alert. Act. - Autonomous Advisory SRE Co-Pilot
echo =======================================================================
echo.

:: Automatically free port 4000 if an old instance was left running
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Starting Backend API ^& Mission Control War Room...
echo Backend Server: http://localhost:4000
echo.

if exist "%~dp0backend" (
    cd /d "%~dp0backend"
) else (
    echo Error: Could not locate backend directory!
    pause
    exit /b 1
)

:: Automatically launch the browser after the server spins up
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:4000"

node src/server.js
pause
