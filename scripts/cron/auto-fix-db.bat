@echo off
REM Automatische database schema validatie en type generatie
cd %~dp0\..\..
call npm run db:types
call npm run db:validate
call npm run fix:types

REM Run auto-fix system
node scripts\auto-fix-system.js
node scripts\fix-typescript.js

REM Log resultaat
echo %date% %time%: Automatische database integratie en auto-fix uitgevoerd >> logs\auto-fix.log
