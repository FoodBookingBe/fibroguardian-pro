#!/bin/bash
# Auto-Fix Enhanced TypeScript Errors (Unix/Linux/macOS)
# This script runs the enhanced specific error fixer to automatically fix TypeScript errors

echo "[$(date)] Starting Enhanced TypeScript Auto-Fix..."

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Navigate to the project root directory
cd "$SCRIPT_DIR/../.."

# Run the enhanced specific error fixer
node scripts/enhanced-specific-errors.js

# Check if there are still TypeScript errors
echo "[$(date)] Checking for remaining TypeScript errors..."
if npx tsc --noEmit > /dev/null 2>&1; then
    echo "[$(date)] No TypeScript errors found!"
else
    echo "[$(date)] Some TypeScript errors still remain"
    echo "[$(date)] Run \"npx tsc --noEmit\" to see detailed errors"
fi

echo "[$(date)] Enhanced TypeScript Auto-Fix completed"
