# Unified TypeScript Auto-Fix System

The Unified TypeScript Auto-Fix System is a comprehensive solution for automatically fixing common TypeScript errors in the FibroGuardian codebase. It helps maintain code quality and reduces the time spent on fixing repetitive TypeScript errors.

## Features

The system can automatically fix the following types of TypeScript errors:

1. **Unknown Event Type Errors** (`'e' is of type 'unknown'`)
   - Automatically adds appropriate type annotations to event handlers
   - Supports various event types (change, click, submit, keydown, etc.)

2. **"use client" Directive Placement**
   - Ensures the "use client" directive is always at the top of the file
   - Prevents the common error: "The `\"use client\"` directive must be put at the top of the file"

3. **React Fragment Usage**
   - Replaces empty React fragments with null returns when appropriate
   - Improves code clarity and performance

4. **Rest Parameter Types**
   - Adds type annotations to rest parameters
   - Fixes "Rest parameter implicitly has an 'any[]' type" errors

5. **Possibly Undefined Access**
   - Adds optional chaining to prevent "Object is possibly 'undefined'" errors
   - Makes code more robust against null/undefined values

## How It Works

The system consists of several components:

1. **Unified Auto-Fix Script** (`scripts/unified-auto-fix.js`)
   - The main script that orchestrates the auto-fix process
   - Scans the codebase for TypeScript files and applies fixes

2. **Error Patterns** (`scripts/data/error-patterns.json`)
   - Defines patterns of TypeScript errors to look for
   - Maps error codes to fix functions

3. **Cron Job Scripts**
   - Windows: `scripts/cron/auto-fix-typescript.bat`
   - Unix/Linux: `scripts/cron/auto-fix-typescript.sh`
   - Allows scheduling the auto-fix process to run automatically

4. **GitHub Actions Workflow** (`.github/workflows/auto-fix.yml`)
   - Runs the auto-fix system in CI/CD pipeline
   - Creates pull requests with fixes for review

## Usage

### Manual Execution

To run the auto-fix system manually:

```bash
# From the project root
node scripts/unified-auto-fix.js
```

### Scheduled Execution

#### Windows

1. Open Task Scheduler
2. Create a new task
3. Set the program/script to: `path\to\FibroGuardian\scripts\cron\auto-fix-typescript.bat`
4. Set the schedule as desired (e.g., daily at 2 AM)

#### Unix/Linux

1. Make the script executable:

   ```bash
   chmod +x scripts/cron/auto-fix-typescript.sh
   ```

2. Add to crontab:

   ```bash
   # Edit crontab
   crontab -e

   # Add line to run daily at 2 AM
   0 2 * * * /path/to/FibroGuardian/scripts/cron/auto-fix-typescript.sh
   ```

### GitHub Actions

The auto-fix system runs automatically:

- Every day at 2 AM UTC
- On pull requests to the main branch (for TypeScript files)
- Manually via the "Actions" tab in GitHub

## Extending the System

### Adding New Error Patterns

To add support for a new type of TypeScript error:

1. Add a new entry to `scripts/data/error-patterns.json`:

   ```json
   {
     "code": "YOUR_ERROR_CODE",
     "message": "Error message pattern to match",
     "fixFunction": "nameOfFixFunction"
   }
   ```

2. Implement the fix function in `scripts/unified-auto-fix.js`:

   ```javascript
   function nameOfFixFunction(filePath, content) {
     // Your fix logic here
     // Return { content: modifiedContent, modified: boolean }
   }
   ```

3. Add the function to the `fixFunctions` array in the `fixTypeScriptErrorsInFile` function.

## Troubleshooting

### Logs

The auto-fix system generates detailed logs in the `logs/` directory. Each run creates a timestamped log file:

```
logs/unified-auto-fix-YYYY-MM-DDTHH-MM-SS.log
```

Check these logs for information about:

- Files processed
- Fixes applied
- Errors encountered

### Common Issues

1. **Script fails to run**
   - Ensure Node.js is installed
   - Check file permissions for the scripts
   - Verify the project structure is intact

2. **Fixes not being applied**
   - Check the error patterns in `scripts/data/error-patterns.json`
   - Ensure the TypeScript files are in the expected locations
   - Review the logs for specific error messages

3. **GitHub Actions workflow fails**
   - Check the workflow run logs in GitHub Actions
   - Ensure the repository has the necessary permissions
   - Verify the workflow file syntax is correct

## Best Practices

1. **Review Auto-Fixed Code**
   - Always review code that has been automatically fixed
   - The system is designed to be safe, but edge cases may exist

2. **Run Tests After Fixes**
   - Run the test suite after applying auto-fixes to ensure functionality is preserved

3. **Commit Regularly**
   - Commit your changes before running the auto-fix system
   - This makes it easier to revert if necessary

4. **Update Error Patterns**
   - Regularly update the error patterns as new TypeScript versions are released
   - Add patterns for common errors encountered in the codebase
