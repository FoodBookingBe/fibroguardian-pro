#!/bin/bash
# Automatische database backup
cd $(dirname "$0")/../..

# Maak backup directory
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/database"
mkdir -p $BACKUP_DIR

# Supabase backup via API
if [ -f .env.local ]; then
  source .env.local
  if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_KEY" ]; then
    echo "Backing up database via Supabase API..."
    curl -X POST "$SUPABASE_URL/rest/v1/rpc/pg_dump" \
      -H "apikey: $SUPABASE_SERVICE_KEY" \
      -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
      -H "Content-Type: application/json" \
      -d "{}" \
      -o "$BACKUP_DIR/supabase_backup_$TIMESTAMP.sql"
    
    # Comprimeer de backup
    gzip "$BACKUP_DIR/supabase_backup_$TIMESTAMP.sql"
    
    echo "Database backup completed: $BACKUP_DIR/supabase_backup_$TIMESTAMP.sql.gz"
  else
    echo "Supabase credentials not found in .env.local"
  fi
else
  echo ".env.local file not found"
fi

# Verwijder backups ouder dan 30 dagen
find $BACKUP_DIR -name "*.sql.gz" -type f -mtime +30 -delete

# Log resultaat
echo "$(date): Database backup uitgevoerd" >> logs/auto-fix.log
