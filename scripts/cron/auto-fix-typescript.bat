@echo off
REM Auto-Fix TypeScript Script
REM This script automatically fixes TypeScript errors in the codebase
REM It can be run as a scheduled task or as part of a CI/CD pipeline

REM Change to project root directory
cd /d "%~dp0\..\.."

REM Create logs directory if it doesn't exist
if not exist logs mkdir logs

REM Log start time
echo Starting TypeScript auto-fix at %date% %time%
echo ----------------------------------------

REM Run the TypeScript fixer script
node scripts/fix-typescript.js

REM Check if there are still TypeScript errors
echo Checking for remaining TypeScript errors...
npx tsc --noEmit > logs\typescript-check-temp.log 2>&1

findstr /c:"error TS" logs\typescript-check-temp.log > nul
if %errorlevel% equ 0 (
  REM Count errors
  findstr /c:"error TS" logs\typescript-check-temp.log > logs\typescript-errors-temp.log
  for /f %%a in ('type logs\typescript-errors-temp.log ^| find /c /v ""') do set ERROR_COUNT=%%a
  echo [33m⚠️ %ERROR_COUNT% TypeScript errors still remain[0m

  REM Save errors to a log file for review
  set LOG_FILE=logs\typescript-errors-%date:~-4,4%%date:~-7,2%%date:~-10,2%-%time:~0,2%%time:~3,2%%time:~6,2%.log
  set LOG_FILE=%LOG_FILE: =0%
  copy logs\typescript-check-temp.log "%LOG_FILE%" > nul
  echo Errors saved to %LOG_FILE%
) else (
  echo [32m✅ No TypeScript errors remaining![0m
)

REM Clean up temp files
del logs\typescript-check-temp.log 2>nul
del logs\typescript-errors-temp.log 2>nul

echo ----------------------------------------
echo TypeScript auto-fix completed at %date% %time%
