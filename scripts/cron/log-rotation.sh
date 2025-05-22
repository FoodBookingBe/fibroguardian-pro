#!/bin/bash
# Automatische log rotatie en cleanup
cd $(dirname "$0")/../..

# Maak backup van huidige logs
TIMESTAMP=$(date +%Y%m%d)
mkdir -p logs/archive

# Roteer auto-fix.log als het groter is dan 1MB
if [ -f logs/auto-fix.log ] && [ $(stat -c%s logs/auto-fix.log) -gt 1048576 ]; then
  cp logs/auto-fix.log logs/archive/auto-fix-$TIMESTAMP.log
  echo "# FibroGuardian Auto-Fix System Log" > logs/auto-fix.log
  echo "" >> logs/auto-fix.log
  echo "Dit logbestand bevat alle uitgevoerde acties van het Auto-Fix System." >> logs/auto-fix.log
  echo "" >> logs/auto-fix.log
  echo "$(date): Log file geroteerd, oude log gearchiveerd naar logs/archive/auto-fix-$TIMESTAMP.log" >> logs/auto-fix.log
fi

# Verwijder logs ouder dan 30 dagen
find logs/archive -name "*.log" -type f -mtime +30 -delete

# Comprimeer logs ouder dan 7 dagen
find logs/archive -name "*.log" -type f -mtime +7 -not -name "*.gz" -exec gzip {} \;

# Log resultaat
echo "$(date): Log rotatie en cleanup uitgevoerd" >> logs/auto-fix.log
