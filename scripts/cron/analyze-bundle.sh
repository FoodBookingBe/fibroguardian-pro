#!/bin/bash
# Automatische bundle analyse en optimalisatie
cd $(dirname "$0")/../..

# Run bundle analyzer
npm run analyze-bundle

# Genereer rapport
mkdir -p reports/bundle
cp .next/analyze/client.html reports/bundle/client-$(date +%Y%m%d).html
cp .next/analyze/server.html reports/bundle/server-$(date +%Y%m%d).html

# Zoek naar grote modules (>100KB)
echo "Grote modules (>100KB):" > reports/bundle/large-modules-$(date +%Y%m%d).txt
grep -A 10 "size: [0-9]\{6,\}" .next/analyze/client.txt >> reports/bundle/large-modules-$(date +%Y%m%d).txt

# Log resultaat
echo "$(date): Bundle analyse uitgevoerd" >> logs/auto-fix.log
