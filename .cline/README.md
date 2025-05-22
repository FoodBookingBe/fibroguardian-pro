# Cline Configuration for FibroGuardian Pro

This directory contains configuration files for the Cline + Claude 3.7 integration.

## How to Use

1. Copy the settings from `settings.json` to your VS Code settings.
2. Set your Claude API key in the VS Code settings.
3. Restart VS Code to apply the changes.

## Files

- `settings.json`: Contains the Cline configuration settings.
- `prompts/`: Contains domain-specific prompts for FibroGuardian.
- `watchers/`: Contains schema watchers that detect database changes.
- `context/`: Contains context providers for Claude 3.7.
- `commands/`: Contains auto-commands for automated tasks.
- `notifications/`: Directory for Cline notifications.

## Commands

- `npm run cline:setup`: Setup Cline integration.
- `npm run cline:test`: Test Cline integration.
- `npm run cline:reset`: Reset Cline notifications.
- `npm run cline:context`: Regenerate Cline context.
