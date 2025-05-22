#!/bin/bash
# Automatische database optimalisatie
cd $(dirname "$0")/../..

# Run database optimalisatie
npm run db:optimize

# Log resultaat
echo "$(date): Database optimalisatie uitgevoerd" >> logs/auto-fix.log
