@echo off
REM Auto-Fix Enhanced TypeScript Errors (Windows)
REM This script runs the enhanced specific error fixer to automatically fix TypeScript errors

echo [%date% %time%] Starting Enhanced TypeScript Auto-Fix...

cd %~dp0..\..

REM Run the enhanced specific error fixer
node scripts/enhanced-specific-errors.js

REM Check if there are still TypeScript errors
echo [%date% %time%] Checking for remaining TypeScript errors...
npx tsc --noEmit > nul 2>&1
if %errorlevel% equ 0 (
    echo [%date% %time%] No TypeScript errors found!
) else (
    echo [%date% %time%] Some TypeScript errors still remain
    echo [%date% %time%] Run "npx tsc --noEmit" to see detailed errors
)

echo [%date% %time%] Enhanced TypeScript Auto-Fix completed
