@echo off
REM Automatische log rotatie en cleanup
cd %~dp0\..\..

REM Maak backup van huidige logs
set TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%
if not exist logs\archive mkdir logs\archive

REM Roteer auto-fix.log als het groter is dan 1MB
for %%F in (logs\auto-fix.log) do set size=%%~zF
if exist logs\auto-fix.log if %size% GTR 1048576 (
  copy logs\auto-fix.log logs\archive\auto-fix-%TIMESTAMP%.log
  echo # FibroGuardian Auto-Fix System Log > logs\auto-fix.log
  echo. >> logs\auto-fix.log
  echo Dit logbestand bevat alle uitgevoerde acties van het Auto-Fix System. >> logs\auto-fix.log
  echo. >> logs\auto-fix.log
  echo %date% %time%: Log file geroteerd, oude log gearchiveerd naar logs\archive\auto-fix-%TIMESTAMP%.log >> logs\auto-fix.log
)

REM Verwijder logs ouder dan 30 dagen
forfiles /p logs\archive /s /m *.log /d -30 /c "cmd /c del @path" 2>nul

REM Log resultaat
echo %date% %time%: Log rotatie en cleanup uitgevoerd >> logs\auto-fix.log
