#!/bin/bash
# Automatische database schema validatie en type generatie
cd C:\Users\nick\Desktop\FibroGuardian
npm run db:types
npm run db:validate
npm run fix:types

# Run auto-fix system
node scripts/auto-fix-system.js
node scripts/fix-typescript.js

# Log resultaat
echo "$(date): Automatische database integratie en auto-fix uitgevoerd" >> logs/auto-fix.log
