@echo off
REM Unified TypeScript Auto-Fix System - Scheduled Task Script
REM This script is designed to be run as a scheduled task to automatically fix TypeScript errors

cd /d %~dp0\..\..
echo Running Unified TypeScript Auto-Fix System at %date% %time%
node scripts/unified-auto-fix.js

REM Check if the script ran successfully
if %ERRORLEVEL% NEQ 0 (
  echo Error: Unified TypeScript Auto-Fix System failed with exit code %ERRORLEVEL%
  exit /b %ERRORLEVEL%
)

echo Unified TypeScript Auto-Fix System completed successfully
exit /b 0
