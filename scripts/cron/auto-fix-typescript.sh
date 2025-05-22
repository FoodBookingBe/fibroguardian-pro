#!/bin/bash

# Auto-Fix TypeScript Script
# This script automatically fixes TypeScript errors in the codebase
# It can be run as a cron job or as part of a CI/CD pipeline

# Change to project root directory
cd "$(dirname "$0")/../.."

# Log start time
echo "Starting TypeScript auto-fix at $(date)"
echo "----------------------------------------"

# Run the TypeScript fixer script
node scripts/fix-typescript.js

# Check if there are still TypeScript errors
echo "Checking for remaining TypeScript errors..."
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
  ERROR_COUNT=$(npx tsc --noEmit 2>&1 | grep -c "error TS")
  echo "⚠️ $ERROR_COUNT TypeScript errors still remain"

  # Save errors to a log file for review
  npx tsc --noEmit > logs/typescript-errors-$(date +%Y%m%d-%H%M%S).log 2>&1
  echo "Errors saved to logs/typescript-errors-$(date +%Y%m%d-%H%M%S).log"
else
  echo "✅ No TypeScript errors remaining!"
fi

echo "----------------------------------------"
echo "TypeScript auto-fix completed at $(date)"
