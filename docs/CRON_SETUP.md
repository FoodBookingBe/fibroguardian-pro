
# Automatische Database Integratie en Auto-Fix

Om de automatische database integratie en auto-fix in te stellen, voeg de volgende regel toe aan je crontab:

```
# Run elke dag om 2:00 AM
0 2 * * * C:\Users\nick\Desktop\FibroGuardian/scripts/cron/auto-fix-db.sh
```

Je kunt dit doen door `crontab -e` uit te voeren en de bovenstaande regel toe te voegen.

Voor Windows, gebruik Task Scheduler om het script `scripts/cron/auto-fix-db.sh` dagelijks uit te voeren.
