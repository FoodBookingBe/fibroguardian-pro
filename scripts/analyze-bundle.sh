#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================${NC}"
echo -e "${BLUE}FibroGuardian Bundle Analyzer Tool${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""
echo "This script will run the Next.js bundle analyzer to help identify"
echo "optimization opportunities in the JavaScript bundles."
echo ""
echo "The analysis will:"
echo "1. Build the application in production mode"
echo "2. Generate interactive visualizations of bundle content"
echo "3. Open these visualizations in your browser"
echo ""
echo -e "${YELLOW}Note: This process may take several minutes to complete.${NC}"
echo ""
echo "Press Ctrl+C to cancel or Enter to continue..."
read -r

echo ""
echo -e "${GREEN}Starting bundle analysis...${NC}"
echo ""

# Create reports directory if it doesn't exist
mkdir -p reports

# Get current date for report naming
DATE=$(date +"%Y-%m-%d")

# Run Next.js build with bundle analyzer enabled
ANALYZE=true npm run build

echo ""
echo -e "${GREEN}Bundle analysis complete!${NC}"
echo ""
echo "If the visualization didn't open automatically, you can find the reports in:"
echo "- .next/analyze/client.html (Client bundles)"
echo "- .next/analyze/server.html (Server bundles)"
echo ""

# Log the analysis run
echo "Bundle analysis run on $(date)" >> reports/bundle-analysis-log.txt

echo -e "${BLUE}Recommended next steps:${NC}"
echo "1. Look for large chunks and modules in the report"
echo "2. Identify opportunities for code splitting and lazy loading"
echo "3. Consider replacing large dependencies with smaller alternatives"
echo "4. Update the optimization checklist with your findings"
echo ""
