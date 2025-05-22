@echo off
REM Automatische database backup
cd %~dp0\..\..

REM Maak backup directory
set TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_DIR=backups\database
if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

REM Supabase backup via API
if exist .env.local (
  REM Lees de Supabase credentials uit .env.local
  for /f "tokens=1,2 delims==" %%a in (.env.local) do (
    if "%%a"=="SUPABASE_URL" set SUPABASE_URL=%%b
    if "%%a"=="SUPABASE_SERVICE_KEY" set SUPABASE_SERVICE_KEY=%%b
  )
  
  if defined SUPABASE_URL if defined SUPABASE_SERVICE_KEY (
    echo Backing up database via Supabase API...
    curl -X POST "%SUPABASE_URL%/rest/v1/rpc/pg_dump" ^
      -H "apikey: %SUPABASE_SERVICE_KEY%" ^
      -H "Authorization: Bearer %SUPABASE_SERVICE_KEY%" ^
      -H "Content-Type: application/json" ^
      -d "{}" ^
      -o "%BACKUP_DIR%\supabase_backup_%TIMESTAMP%.sql"
    
    echo Database backup completed: %BACKUP_DIR%\supabase_backup_%TIMESTAMP%.sql
  ) else (
    echo Supabase credentials not found in .env.local
  )
) else (
  echo .env.local file not found
)

REM Verwijder backups ouder dan 30 dagen
forfiles /p %BACKUP_DIR% /s /m *.sql /d -30 /c "cmd /c del @path" 2>nul

REM Log resultaat
echo %date% %time%: Database backup uitgevoerd >> logs\auto-fix.log
