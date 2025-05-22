@echo off
REM Automatische database optimalisatie
cd %~dp0\..\..

REM Run database optimalisatie
call npm run db:optimize

REM Log resultaat
echo %date% %time%: Database optimalisatie uitgevoerd >> logs\auto-fix.log
