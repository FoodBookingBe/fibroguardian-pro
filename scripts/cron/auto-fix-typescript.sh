#!/bin/bash
# Unified TypeScript Auto-Fix System - Scheduled Task Script
# This script is designed to be run as a cron job to automatically fix TypeScript errors

# Navigate to the project root directory
cd "$(dirname "$0")/../.." || exit 1

# Log the start time
echo "Running Unified TypeScript Auto-Fix System at $(date)"

# Run the auto-fix script
node scripts/unified-auto-fix.js

# Check if the script ran successfully
if [ $? -ne 0 ]; then
  echo "Error: Unified TypeScript Auto-Fix System failed with exit code $?"
  exit 1
fi

echo "Unified TypeScript Auto-Fix System completed successfully"
exit 0
