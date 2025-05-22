# Cron Setup for FibroGuardian

This document describes how to set up automated tasks using cron jobs (Linux/macOS) or Task Scheduler (Windows) for the FibroGuardian application.

## Available Cron Scripts

The following cron scripts are available:

| Script | Description | Windows | Unix/Linux/macOS |
|--------|-------------|---------|-----------------|
| Auto-Fix TypeScript | Automatically fixes TypeScript errors | `scripts/cron/auto-fix-typescript.bat` | `scripts/cron/auto-fix-typescript.sh` |
| Enhanced Auto-Fix TypeScript | Automatically fixes TypeScript errors with enhanced capabilities | `scripts/cron/auto-fix-enhanced.bat` | `scripts/cron/auto-fix-enhanced.sh` |
| Auto-Fix Database | Automatically fixes database issues | `scripts/cron/auto-fix-db.bat` | `scripts/cron/auto-fix-db.sh` |
| Optimize Database | Optimizes database performance | `scripts/cron/optimize-database.bat` | `scripts/cron/optimize-database.sh` |
| Analyze Bundle | Analyzes bundle size | `scripts/cron/analyze-bundle.bat` | `scripts/cron/analyze-bundle.sh` |
| Log Rotation | Rotates log files | `scripts/cron/log-rotation.bat` | `scripts/cron/log-rotation.sh` |
| Backup Database | Backs up the database | `scripts/cron/backup-database.bat` | `scripts/cron/backup-database.sh` |
| Performance Monitor | Monitors application performance | `scripts/cron/performance-monitor.bat` | `scripts/cron/performance-monitor.sh` |

## Setting Up Cron Jobs (Linux/macOS)

To set up a cron job on Linux or macOS, follow these steps:

1. Open a terminal
2. Run `crontab -e` to edit your crontab
3. Add a line for each script you want to run, using the following format:

```
# Run every day at 2:00 AM
0 2 * * * /path/to/FibroGuardian/scripts/cron/auto-fix-db.sh

# Run every day at 3:00 AM
0 3 * * * /path/to/FibroGuardian/scripts/cron/auto-fix-enhanced.sh

# Run every day at 4:00 AM
0 4 * * * /path/to/FibroGuardian/scripts/cron/optimize-database.sh
```

4. Save and exit the editor

## Setting Up Task Scheduler (Windows)

To set up a scheduled task on Windows, follow these steps:

1. Open Task Scheduler
2. Click "Create Basic Task"
3. Enter a name and description for the task
4. Set the trigger (e.g., daily at 2:00 AM)
5. Set the action to "Start a program"
6. Browse to the script you want to run (e.g., `C:\path\to\FibroGuardian\scripts\cron\auto-fix-db.bat`)
7. Complete the wizard

## Recommended Schedule

Here's a recommended schedule for running the cron scripts:

| Script | Recommended Schedule |
|--------|---------------------|
| Auto-Fix TypeScript | Daily at 1:00 AM |
| Enhanced Auto-Fix TypeScript | Daily at 2:00 AM |
| Auto-Fix Database | Daily at 3:00 AM |
| Optimize Database | Weekly on Sunday at 4:00 AM |
| Analyze Bundle | Weekly on Monday at 5:00 AM |
| Log Rotation | Daily at 6:00 AM |
| Backup Database | Daily at 7:00 AM |
| Performance Monitor | Hourly |

## Logging

All cron scripts log their output to the `logs` directory. You can check the logs to see if the scripts ran successfully.

## Troubleshooting

If a cron script is not running as expected, check the following:

1. Make sure the script has execute permissions (Linux/macOS): `chmod +x /path/to/script.sh`
2. Check the logs in the `logs` directory
3. Try running the script manually to see if there are any errors
4. Make sure the cron service is running (Linux/macOS): `service cron status`
5. Check the Task Scheduler history (Windows)
