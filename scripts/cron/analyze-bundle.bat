@echo off
REM Automatische bundle analyse en optimalisatie
cd %~dp0\..\..

REM Run bundle analyzer
call npm run analyze-bundle

REM Genereer rapport
if not exist reports\bundle mkdir reports\bundle
copy .next\analyze\client.html reports\bundle\client-%date:~-4,4%%date:~-7,2%%date:~-10,2%.html
copy .next\analyze\server.html reports\bundle\server-%date:~-4,4%%date:~-7,2%%date:~-10,2%.html

REM Log resultaat
echo %date% %time%: Bundle analyse uitgevoerd >> logs\auto-fix.log
