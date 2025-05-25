#!/usr/bin/env node

/**
 * Unified TypeScript Auto-Fix System
 *
 * This script automatically fixes common TypeScript errors in the FibroGuardian project.
 * It uses patterns defined in the typescript-fixes.json file to identify and fix errors.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');

// Configuration
const CONFIG = {
    rootDir: path.resolve(__dirname, '..'),
    fixesFile: path.resolve(__dirname, 'data/typescript-fixes.json'),
    logDir: path.resolve(__dirname, '../logs'),
    fileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
    excludeDirs: ['node_modules', '.next', 'out', 'build', 'dist', 'coverage'],
};

// Ensure log directory exists
if (!fs.existsSync(CONFIG.logDir)) {
    fs.mkdirSync(CONFIG.logDir, { recursive: true });
}

// Set up logging
const logFile = path.join(CONFIG.logDir, `unified-typescript-auto-fix-${new Date().toISOString().replace(/:/g, '-')}.log`);
const logger = {
    log: (message) => {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        fs.appendFileSync(logFile, logMessage + '\n');
    },
    error: (message, error) => {
        const timestamp = new Date().toISOString();
        const errorMessage = `[${timestamp}] ERROR: ${message}${error ? ': ' + error.message : ''}`;
        console.error(errorMessage);
        fs.appendFileSync(logFile, errorMessage + '\n');
        if (error && error.stack) {
            fs.appendFileSync(logFile, error.stack + '\n');
        }
    }
};

// Load the fixes configuration
let fixes;
try {
    const fixesContent = fs.readFileSync(CONFIG.fixesFile, 'utf8');
    fixes = JSON.parse(fixesContent);
    logger.log(`Loaded ${fixes.errorPatterns.length} error patterns and ${Object.keys(fixes.specificFixes).length} specific file fixes`);
} catch (error) {
    logger.error('Failed to load fixes configuration', error);
    process.exit(1);
}

// Find all TypeScript/JavaScript files in the project
function findFiles() {
    const patterns = CONFIG.fileExtensions.map(ext => `**/*${ext}`);
    const options = {
        cwd: CONFIG.rootDir,
        ignore: CONFIG.excludeDirs.map(dir => `**/${dir}/**`),
        absolute: true,
    };

    let files = [];
    patterns.forEach(pattern => {
        const matches = glob.sync(pattern, options);
        files = files.concat(matches);
    });

    return files;
}

// Apply regex-based fixes to a file
function applyRegexFixes(filePath, content, patterns) {
    let modified = false;
    let newContent = content;

    patterns.forEach(({ pattern, replacement }) => {
        const regex = new RegExp(pattern, 'g');
        const originalContent = newContent;
        newContent = newContent.replace(regex, replacement);

        if (originalContent !== newContent) {
            modified = true;
            logger.log(`Applied fix to ${filePath}: ${pattern} -> ${replacement.substring(0, 50)}${replacement.length > 50 ? '...' : ''}`);
        }
    });

    return { content: newContent, modified };
}

// Apply specific fixes for a file
function applySpecificFixes(filePath, content) {
    const relativePath = path.relative(CONFIG.rootDir, filePath).replace(/\\/g, '/');

    if (fixes.specificFixes[relativePath]) {
        logger.log(`Applying specific fixes for ${relativePath}`);
        return applyRegexFixes(filePath, content, fixes.specificFixes[relativePath]);
    }

    return { content, modified: false };
}

// Apply general error pattern fixes
function applyErrorPatternFixes(filePath, content) {
    return applyRegexFixes(filePath, content, fixes.errorPatterns.map(pattern => pattern.fix));
}

// Process a single file
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        let modified = false;

        // Apply fixes in order
        const specificFix = applySpecificFixes(filePath, newContent);
        newContent = specificFix.content;
        modified = modified || specificFix.modified;

        const patternFix = applyErrorPatternFixes(filePath, newContent);
        newContent = patternFix.content;
        modified = modified || patternFix.modified;

        // Write changes if modified
        if (modified) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            logger.log(`Updated ${filePath}`);
            return true;
        }

        return false;
    } catch (error) {
        logger.error(`Error processing file ${filePath}`, error);
        return false;
    }
}

// Main function
function main() {
    logger.log('Starting Unified TypeScript Auto-Fix System');

    try {
        const files = findFiles();
        logger.log(`Found ${files.length} files to process`);

        let fixedFiles = 0;
        files.forEach(file => {
            if (processFile(file)) {
                fixedFiles++;
            }
        });

        logger.log(`Completed processing. Fixed ${fixedFiles} files.`);

        // Run TypeScript check to see if there are still errors
        try {
            logger.log('Running TypeScript check...');
            execSync('npx tsc --noEmit', { cwd: CONFIG.rootDir, stdio: 'pipe' });
            logger.log('TypeScript check passed! No errors found.');
        } catch (error) {
            const errorOutput = error.stdout.toString();
            logger.log('TypeScript check found remaining errors:');
            logger.log(errorOutput);

            // Extract error counts
            const errorMatch = errorOutput.match(/Found (\d+) errors? in (\d+) files?/);
            if (errorMatch) {
                logger.log(`Remaining: ${errorMatch[1]} errors in ${errorMatch[2]} files`);
            }
        }

    } catch (error) {
        logger.error('Error in main process', error);
        process.exit(1);
    }
}

// Run the main function
main();
