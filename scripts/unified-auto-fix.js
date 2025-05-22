/**
 * Unified TypeScript Auto-Fix System
 *
 * This script automatically detects and fixes common TypeScript errors in the codebase.
 * It can be run manually or scheduled as a cron job.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const errorPatterns = require('./data/error-patterns.json');
const typescriptFixes = require('./data/typescript-fixes.json');

// Configuration
const config = {
    rootDir: path.resolve(__dirname, '..'),
    logDir: path.resolve(__dirname, '../logs'),
    excludeDirs: ['node_modules', '.next', 'dist', 'build', 'coverage'],
    fileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
    maxFilesToFix: 100, // Limit to prevent excessive changes
    dryRun: false, // Set to true to preview changes without applying them
};

// Create log directory if it doesn't exist
if (!fs.existsSync(config.logDir)) {
    fs.mkdirSync(config.logDir, { recursive: true });
}

// Create log file with timestamp
const timestamp = new Date().toISOString();
const logFile = path.join(config.logDir, `unified-auto-fix-${timestamp}.log`);
const logger = fs.createWriteStream(logFile, { flags: 'a' });

/**
 * Log a message to both console and log file
 */
function log(message) {
    console.log(message);
    logger.write(message + '\n');
}

/**
 * Find all TypeScript files in the project
 */
function findTypeScriptFiles(dir, excludeDirs, fileExtensions, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (!excludeDirs.includes(entry.name)) {
                findTypeScriptFiles(fullPath, excludeDirs, fileExtensions, files);
            }
        } else if (fileExtensions.includes(path.extname(entry.name))) {
            files.push(fullPath);
        }
    }

    return files;
}

/**
 * Run TypeScript compiler to get errors
 */
function getTypeScriptErrors() {
    try {
        // Run tsc with --noEmit to just check for errors
        execSync('npx tsc --noEmit', { cwd: config.rootDir, stdio: 'pipe' });
        return []; // No errors
    } catch (error) {
        // Parse the error output to extract error information
        const errorOutput = error.stdout.toString();
        const errors = [];

        const errorRegex = /(.+)\((\d+),(\d+)\): error TS(\d+): (.+)/g;
        let match;

        while ((match = errorRegex.exec(errorOutput)) !== null) {
            const [, filePath, line, column, code, message] = match;
            errors.push({
                filePath: path.relative(config.rootDir, filePath),
                line: parseInt(line, 10),
                column: parseInt(column, 10),
                code: parseInt(code, 10),
                message: message.trim(),
            });
        }

        return errors;
    }
}

/**
 * Apply fixes to a file based on detected errors
 */
function applyFixes(filePath, errors) {
    const fullPath = path.join(config.rootDir, filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    let fixesApplied = 0;

    // Group errors by line for more efficient processing
    const errorsByLine = {};
    errors.forEach(error => {
        if (!errorsByLine[error.line]) {
            errorsByLine[error.line] = [];
        }
        errorsByLine[error.line].push(error);
    });

    // Convert content to array of lines for easier manipulation
    const lines = content.split('\n');

    // Process each line with errors
    Object.keys(errorsByLine).forEach(lineNum => {
        const lineErrors = errorsByLine[lineNum];
        const lineIndex = parseInt(lineNum, 10) - 1;
        let line = lines[lineIndex];

        // Apply fixes for each error on this line
        lineErrors.forEach(error => {
            const fix = findFixForError(error);
            if (fix) {
                const newLine = applyFixToLine(line, error, fix);
                if (newLine !== line) {
                    line = newLine;
                    fixesApplied++;
                    log(`Fixed TS${error.code} in ${filePath}:${error.line} - ${error.message}`);
                }
            }
        });

        // Update the line in the array
        lines[lineIndex] = line;
    });

    // Write the updated content back to the file
    if (fixesApplied > 0 && !config.dryRun) {
        fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
    }

    return fixesApplied;
}

/**
 * Find an appropriate fix for a given error
 */
function findFixForError(error) {
    // Check if we have a specific fix for this error code
    const errorPattern = errorPatterns.find(pattern =>
        pattern.code === error.code &&
        (pattern.messagePattern ? new RegExp(pattern.messagePattern).test(error.message) : true)
    );

    if (errorPattern) {
        return errorPattern;
    }

    // Check if we have a generic fix based on the error message
    return errorPatterns.find(pattern =>
        pattern.code === 0 && // Generic pattern
        pattern.messagePattern &&
        new RegExp(pattern.messagePattern).test(error.message)
    );
}

/**
 * Apply a fix to a specific line
 */
function applyFixToLine(line, error, fix) {
    switch (fix.fixType) {
        case 'replace':
            return line.replace(new RegExp(fix.search), fix.replace);

        case 'insertBefore':
            return fix.insert + line;

        case 'insertAfter':
            return line + fix.insert;

        case 'optionalChaining':
            // Add optional chaining to property access
            const pos = error.column - 1;
            const dotPos = line.lastIndexOf('.', pos);
            if (dotPos >= 0) {
                return line.substring(0, dotPos) + '?.' + line.substring(dotPos + 1);
            }
            return line;

        case 'nullCoalescing':
            // Add null coalescing operator
            const varEndPos = error.column - 1 + error.message.match(/['"]?([^'"]+)['"]? is possibly 'undefined'/)[1].length;
            return line.substring(0, varEndPos) + ' ?? 0' + line.substring(varEndPos);

        case 'typeAssertion':
            // Add type assertion
            const varName = error.message.match(/Property '([^']+)' does not exist/)?.[1];
            if (varName) {
                const varPos = line.indexOf(varName, error.column - 1);
                if (varPos >= 0) {
                    const objectEndPos = line.lastIndexOf('.', varPos);
                    if (objectEndPos >= 0) {
                        const objectName = line.substring(line.lastIndexOf(' ', objectEndPos) + 1, objectEndPos);
                        return line.substring(0, objectEndPos) +
                            ' as any /* TODO: Update type definition */' +
                            line.substring(objectEndPos);
                    }
                }
            }
            return line;

        case 'ignoreNextLine':
            // Add @ts-ignore comment on the previous line
            return '// @ts-ignore - Auto-fixed: ' + error.message + '\n' + line;

        case 'prefixUnused':
            // Prefix unused variables with underscore
            const unusedVar = error.message.match(/'([^']+)' is declared but its value is never read/)?.[1];
            if (unusedVar) {
                return line.replace(
                    new RegExp(`\\b${unusedVar}\\b`),
                    '_' + unusedVar
                );
            }
            return line;

        case 'addNullCheck':
            // Add null check before using a property
            return line.replace(
                new RegExp(fix.search),
                `if (${fix.variable} !== null && ${fix.variable} !== undefined) { ${line} }`
            );

        case 'moveUseClient':
            // Move "use client" directive to the top of the file
            return line; // This is handled separately as it affects multiple lines

        default:
            return line;
    }
}

/**
 * Fix "use client" directive placement
 */
function fixUseClientDirective(filePath) {
    const fullPath = path.join(config.rootDir, filePath);
    let content = fs.readFileSync(fullPath, 'utf8');

    if (content.includes('"use client"') || content.includes("'use client'")) {
        // Check if "use client" is not at the top
        const lines = content.split('\n');
        const useClientIndex = lines.findIndex(line =>
            line.trim() === '"use client"' || line.trim() === "'use client'"
        );

        if (useClientIndex > 0) {
            // Remove the directive from its current position
            const useClientLine = lines[useClientIndex];
            lines.splice(useClientIndex, 1);

            // Add it to the top
            lines.unshift(useClientLine);

            // Write the updated content back to the file
            if (!config.dryRun) {
                fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
            }

            log(`Fixed "use client" directive placement in ${filePath}`);
            return 1;
        }
    }

    return 0;
}

/**
 * Main function to run the auto-fix process
 */
async function runAutoFix() {
    log(`Starting Unified TypeScript Auto-Fix at ${new Date().toLocaleString()}`);
    log(`Configuration: ${JSON.stringify(config, null, 2)}`);

    // Find all TypeScript files
    const files = findTypeScriptFiles(
        config.rootDir,
        config.excludeDirs,
        config.fileExtensions
    );
    log(`Found ${files.length} TypeScript files`);

    // Get TypeScript errors
    const errors = getTypeScriptErrors();
    log(`Found ${errors.length} TypeScript errors`);

    // Group errors by file
    const errorsByFile = {};
    errors.forEach(error => {
        if (!errorsByFile[error.filePath]) {
            errorsByFile[error.filePath] = [];
        }
        errorsByFile[error.filePath].push(error);
    });

    // Apply fixes to files with errors
    let totalFixesApplied = 0;
    let filesFixed = 0;

    const filesToFix = Object.keys(errorsByFile).slice(0, config.maxFilesToFix);

    for (const filePath of filesToFix) {
        const fileErrors = errorsByFile[filePath];
        log(`Processing ${filePath} with ${fileErrors.length} errors`);

        // Fix "use client" directive placement first
        const useClientFixes = fixUseClientDirective(filePath);

        // Apply other fixes
        const fixes = applyFixes(filePath, fileErrors);

        const totalFixes = useClientFixes + fixes;
        if (totalFixes > 0) {
            filesFixed++;
            totalFixesApplied += totalFixes;
        }
    }

    log(`Auto-fix completed: Fixed ${totalFixesApplied} errors in ${filesFixed} files`);
    log(`Log file: ${logFile}`);

    // Close the log file
    logger.end();

    return { totalFixesApplied, filesFixed };
}

// Run the auto-fix process
runAutoFix().catch(error => {
    log(`Error running auto-fix: ${error.message}`);
    logger.end();
});
