#!/bin/bash
# Automatische performance monitoring
cd $(dirname "$0")/../..

# Maak reports directory
TIMESTAMP=$(date +%Y%m%d)
REPORT_DIR="reports/performance"
mkdir -p $REPORT_DIR

# Run Lighthouse voor performance metrics
if command -v lighthouse &> /dev/null; then
  echo "Running Lighthouse performance tests..."
  
  # Test de belangrijkste pagina's
  PAGES=(
    "http://localhost:3000"
    "http://localhost:3000/dashboard"
    "http://localhost:3000/taken"
    "http://localhost:3000/reflecties"
  )
  
  # Start de development server als die nog niet draait
  if ! curl -s http://localhost:3000 > /dev/null; then
    echo "Starting development server..."
    npm run dev &
    DEV_PID=$!
    sleep 10  # Wacht tot de server is opgestart
  fi
  
  # Run Lighthouse voor elke pagina
  for PAGE in "${PAGES[@]}"; do
    PAGE_NAME=$(echo $PAGE | sed 's/http:\/\/localhost:3000\///g' | sed 's/\//-/g')
    if [ -z "$PAGE_NAME" ]; then
      PAGE_NAME="home"
    fi
    
    lighthouse $PAGE --output=json --output=html --output-path=$REPORT_DIR/lighthouse-$PAGE_NAME-$TIMESTAMP --chrome-flags="--headless --no-sandbox"
  done
  
  # Stop de development server als we die hebben gestart
  if [ -n "$DEV_PID" ]; then
    kill $DEV_PID
  fi
else
  echo "Lighthouse is not installed. Install it with: npm install -g lighthouse"
fi

# Run bundle analyzer
npm run analyze-bundle

# Genereer performance rapport
echo "# Performance Report - $(date)" > $REPORT_DIR/performance-report-$TIMESTAMP.md
echo "" >> $REPORT_DIR/performance-report-$TIMESTAMP.md
echo "## Lighthouse Scores" >> $REPORT_DIR/performance-report-$TIMESTAMP.md
echo "" >> $REPORT_DIR/performance-report-$TIMESTAMP.md

# Voeg Lighthouse scores toe aan het rapport
for PAGE in "${PAGES[@]}"; do
  PAGE_NAME=$(echo $PAGE | sed 's/http:\/\/localhost:3000\///g' | sed 's/\//-/g')
  if [ -z "$PAGE_NAME" ]; then
    PAGE_NAME="home"
  fi
  
  if [ -f "$REPORT_DIR/lighthouse-$PAGE_NAME-$TIMESTAMP.report.json" ]; then
    PERFORMANCE=$(jq '.categories.performance.score * 100' $REPORT_DIR/lighthouse-$PAGE_NAME-$TIMESTAMP.report.json)
    ACCESSIBILITY=$(jq '.categories.accessibility.score * 100' $REPORT_DIR/lighthouse-$PAGE_NAME-$TIMESTAMP.report.json)
    SEO=$(jq '.categories.seo.score * 100' $REPORT_DIR/lighthouse-$PAGE_NAME-$TIMESTAMP.report.json)
    
    echo "### $PAGE_NAME" >> $REPORT_DIR/performance-report-$TIMESTAMP.md
    echo "- Performance: $PERFORMANCE" >> $REPORT_DIR/performance-report-$TIMESTAMP.md
    echo "- Accessibility: $ACCESSIBILITY" >> $REPORT_DIR/performance-report-$TIMESTAMP.md
    echo "- SEO: $SEO" >> $REPORT_DIR/performance-report-$TIMESTAMP.md
    echo "" >> $REPORT_DIR/performance-report-$TIMESTAMP.md
  fi
done

# Voeg bundle sizes toe aan het rapport
echo "## Bundle Sizes" >> $REPORT_DIR/performance-report-$TIMESTAMP.md
echo "" >> $REPORT_DIR/performance-report-$TIMESTAMP.md

if [ -f "reports/bundle/large-modules-$TIMESTAMP.txt" ]; then
  echo "### Large Modules (>100KB)" >> $REPORT_DIR/performance-report-$TIMESTAMP.md
  echo '```' >> $REPORT_DIR/performance-report-$TIMESTAMP.md
  cat reports/bundle/large-modules-$TIMESTAMP.txt >> $REPORT_DIR/performance-report-$TIMESTAMP.md
  echo '```' >> $REPORT_DIR/performance-report-$TIMESTAMP.md
fi

# Log resultaat
echo "$(date): Performance monitoring uitgevoerd" >> logs/auto-fix.log
