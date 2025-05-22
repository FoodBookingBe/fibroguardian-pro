@echo off
REM Automatische performance monitoring
cd %~dp0\..\..

REM Maak reports directory
set TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%
set REPORT_DIR=reports\performance
if not exist %REPORT_DIR% mkdir %REPORT_DIR%

REM Run Lighthouse voor performance metrics
where lighthouse >nul 2>&1
if %ERRORLEVEL% == 0 (
  echo Running Lighthouse performance tests...
  
  REM Test de belangrijkste pagina's
  set PAGES=http://localhost:3000 http://localhost:3000/dashboard http://localhost:3000/taken http://localhost:3000/reflecties
  
  REM Start de development server als die nog niet draait
  curl -s http://localhost:3000 >nul 2>&1
  if %ERRORLEVEL% NEQ 0 (
    echo Starting development server...
    start /B npm run dev
    timeout /t 10 /nobreak >nul
  )
  
  REM Run Lighthouse voor elke pagina
  for %%P in (%PAGES%) do (
    set PAGE=%%P
    set PAGE_NAME=!PAGE:http://localhost:3000/=!
    if "!PAGE_NAME!"=="http://localhost:3000" set PAGE_NAME=home
    if "!PAGE_NAME!"=="!PAGE!" set PAGE_NAME=home
    
    set PAGE_NAME=!PAGE_NAME:/=-!
    
    lighthouse !PAGE! --output=json --output=html --output-path=%REPORT_DIR%\lighthouse-!PAGE_NAME!-%TIMESTAMP% --chrome-flags="--headless --no-sandbox"
  )
) else (
  echo Lighthouse is not installed. Install it with: npm install -g lighthouse
)

REM Run bundle analyzer
call npm run analyze-bundle

REM Genereer performance rapport
echo # Performance Report - %date% > %REPORT_DIR%\performance-report-%TIMESTAMP%.md
echo. >> %REPORT_DIR%\performance-report-%TIMESTAMP%.md
echo ## Bundle Sizes >> %REPORT_DIR%\performance-report-%TIMESTAMP%.md
echo. >> %REPORT_DIR%\performance-report-%TIMESTAMP%.md

if exist reports\bundle\large-modules-%TIMESTAMP%.txt (
  echo ### Large Modules ^(^>100KB^) >> %REPORT_DIR%\performance-report-%TIMESTAMP%.md
  echo ``` >> %REPORT_DIR%\performance-report-%TIMESTAMP%.md
  type reports\bundle\large-modules-%TIMESTAMP%.txt >> %REPORT_DIR%\performance-report-%TIMESTAMP%.md
  echo ``` >> %REPORT_DIR%\performance-report-%TIMESTAMP%.md
)

REM Log resultaat
echo %date% %time%: Performance monitoring uitgevoerd >> logs\auto-fix.log
