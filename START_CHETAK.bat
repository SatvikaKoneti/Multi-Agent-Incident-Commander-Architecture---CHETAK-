@echo off
title CHETAK - Multi-Agent Incident Commander
echo =======================================================================
echo    CHETAK: MULTI-AGENT INCIDENT COMMANDER (STATEMENT ID: PNG2)
echo    Detect. Alert. Act. - Autonomous Advisory SRE Co-Pilot
echo =======================================================================
echo.
echo Starting Backend API & Mission Control War Room...
echo Backend Server: http://localhost:4000
echo.
cd /d "%~dp0SDC2_U\SDC2_Updated\SDC2\SDC\backend"
node src/server.js
pause
