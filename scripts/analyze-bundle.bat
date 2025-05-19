@echo off
echo ===================================
echo FibroGuardian Bundle Analyzer Tool
echo ===================================
echo.
echo This script will run the Next.js bundle analyzer to help identify
echo optimization opportunities in the JavaScript bundles.
echo.
echo The analysis will:
echo 1. Build the application in production mode
echo 2. Generate interactive visualizations of bundle content
echo 3. Open these visualizations in your browser
echo.
echo Note: This process may take several minutes to complete.
echo.
echo Press Ctrl+C to cancel or any key to continue...
pause > nul

echo.
echo Starting bundle analysis...
echo.

set ANALYZE=true
call npm run build

echo.
echo Bundle analysis complete!
echo.
echo If the visualization didn't open automatically, you can find the reports in:
echo - .next/analyze/client.html (Client bundles)
echo - .next/analyze/server.html (Server bundles)
echo.
echo Press any key to exit...
pause > nul
