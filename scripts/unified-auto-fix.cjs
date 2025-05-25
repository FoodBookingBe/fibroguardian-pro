/**
 * Unified TypeScript Auto-Fix System
 *
 * This script automatically fixes common TypeScript errors in the codebase.
 * It can be run manually or as part of a CI/CD pipeline.
 *
 * Features:
 * - Fixes 'e' is of type 'unknown' errors by properly typing event handlers
 * - Fixes "use client" directive placement
 * - Fixes import references (e.g., _useAuth to useAuth)
 * - Fixes other common TypeScript errors
 *
 * Usage:
 * node scripts/unified-auto-fix.cjs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const LOG_DIR = path.join(ROOT_DIR, 'logs');
const TYPESCRIPT_FIXES_FILE = path.join(__dirname, 'data', 'typescript-fixes.json');
const ERROR_PATTERNS_FILE = path.join(__dirname, 'data', 'error-patterns.json');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Create log file with timestamp
const timestamp = new Date().toISOString().replace(/:/g, '-');
const logFile = path.join(LOG_DIR, `unified-auto-fix-${timestamp}.log`);
const logger = fs.createWriteStream(logFile, { flags: 'a' });

// Load fix patterns
let typescriptFixes = [];
let errorPatterns = [];

try {
    if (fs.existsSync(TYPESCRIPT_FIXES_FILE)) {
        typescriptFixes = JSON.parse(fs.readFileSync(TYPESCRIPT_FIXES_FILE, 'utf8'));
    }

    if (fs.existsSync(ERROR_PATTERNS_FILE)) {
        errorPatterns = JSON.parse(fs.readFileSync(ERROR_PATTERNS_FILE, 'utf8'));
    }
} catch (error) {
    log(`Error loading fix patterns: ${error.message}`);
}

// Initialize with default patterns if none were loaded
if (typescriptFixes.length === 0) {
    typescriptFixes = [
        {
            "name": "Fix unknown event type",
            "pattern": "(e\\s*:\\s*unknown)\\s*\\)",
            "replacement": "e: React.ChangeEvent<HTMLInputElement>)",
            "filePattern": "\\.(tsx|jsx)$"
        },
        {
            "name": "Fix unknown form event type",
            "pattern": "(e\\s*:\\s*unknown)\\s*=>\\s*\\{",
            "replacement": "e: React.FormEvent<HTMLFormElement>) => {",
            "filePattern": "\\.(tsx|jsx)$"
        },
        {
            "name": "Fix unknown mouse event type",
            "pattern": "(e\\s*:\\s*unknown)\\s*=>\\s*\\{\\s*.*\\.preventDefault\\(\\)",
            "replacement": "e: React.MouseEvent<HTMLElement>) => {\n    e.preventDefault()",
            "filePattern": "\\.(tsx|jsx)$"
        },
        {
            "name": "Fix _useAuth import",
            "pattern": "import\\s*\\{\\s*_useAuth\\s+as\\s+useAuth\\s*\\}\\s*from\\s*['\"]@/components/auth/AuthProvider['\"]",
            "replacement": "import { useAuth } from '@/components/auth/AuthProvider'",
            "filePattern": "\\.(tsx|jsx|ts)$"
        },
        {
            "name": "Fix use client directive placement",
            "pattern": "([\\s\\S]*?)('use client';)",
            "replacement": "'use client';\n\n$1",
            "filePattern": "\\.(tsx|jsx)$",
            "condition": "content.includes('use client') && !content.trim().startsWith('use client')"
        }
    ];
}

if (errorPatterns.length === 0) {
    errorPatterns = [
        {
            "code": "18046",
            "message": "'e' is of type 'unknown'",
            "fixName": "Fix unknown event type"
        },
        {
            "code": "71004",
            "message": "The `\"use client\"` directive must be put at the top of the file",
            "fixName": "Fix use client directive placement"
        }
    ];
}

// Save the default patterns if they don't exist
if (!fs.existsSync(TYPESCRIPT_FIXES_FILE)) {
    const dataDir = path.dirname(TYPESCRIPT_FIXES_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(TYPESCRIPT_FIXES_FILE, JSON.stringify(typescriptFixes, null, 2));
}

if (!fs.existsSync(ERROR_PATTERNS_FILE)) {
    const dataDir = path.dirname(ERROR_PATTERNS_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(ERROR_PATTERNS_FILE, JSON.stringify(errorPatterns, null, 2));
}

// Logging function
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    logger.write(logMessage + '\n');
}

// Get TypeScript errors from the project
async function getTypeScriptErrors() {
    try {
        // Run TypeScript compiler in noEmit mode to get errors
        const tscOutput = execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' }).toString();
        return parseTypeScriptErrors(tscOutput);
    } catch (error) {
        // TypeScript will exit with non-zero code if there are errors, which is expected
        return parseTypeScriptErrors(error.stdout);
    }
}

// Parse TypeScript error output
function parseTypeScriptErrors(output) {
    const errors = [];
    const lines = output.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/(.+)\((\d+),(\d+)\):\s+error\s+TS(\d+):\s+(.+)/);

        if (match) {
            const [, filePath, lineNumber, column, code, message] = match;
            errors.push({
                filePath: path.resolve(filePath),
                lineNumber: parseInt(lineNumber, 10),
                column: parseInt(column, 10),
                code,
                message
            });
        }
    }

    return errors;
}

// Find files recursively
async function findFiles(dir, pattern) {
    const files = [];
    const entries = await readdir(dir);

    for (const entry of entries) {
        if (entry === 'node_modules' || entry === '.git' || entry === '.next') continue;

        const entryPath = path.join(dir, entry);
        const stats = await stat(entryPath);

        if (stats.isDirectory()) {
            const subFiles = await findFiles(entryPath, pattern);
            files.push(...subFiles);
        } else if (pattern.test(entry)) {
            files.push(entryPath);
        }
    }

    return files;
}

// Apply fixes to a file
async function applyFixes(filePath, fixes) {
    try {
        let content = await readFile(filePath, 'utf8');
        let fixesApplied = 0;

        for (const fix of fixes) {
            const regex = new RegExp(fix.pattern, 'g');

            // Check if the fix has a condition
            if (fix.condition) {
                // Create a function from the condition string
                const conditionFn = new Function('content', `return ${fix.condition}`);
                if (!conditionFn(content)) continue;
            }

            const originalContent = content;
            content = content.replace(regex, fix.replacement);

            if (content !== originalContent) {
                fixesApplied++;
                log(`Applied fix "${fix.name}" to ${filePath}`);
            }
        }

        if (fixesApplied > 0) {
            await writeFile(filePath, content, 'utf8');
            log(`Fixed ${fixesApplied} issues in ${filePath}`);
        }

        return fixesApplied;
    } catch (error) {
        log(`Error applying fixes to ${filePath}: ${error.message}`);
        return 0;
    }
}

// Fix TypeScript errors based on error patterns
async function fixTypeScriptErrors(errors) {
    const fixesByFile = {};

    // Group errors by file
    for (const error of errors) {
        const { filePath, code, message } = error;

        // Find matching error pattern
        const matchingPattern = errorPatterns.find(pattern =>
            pattern.code === code && message.includes(pattern.message)
        );

        if (matchingPattern) {
            // Find the corresponding fix
            const fix = typescriptFixes.find(f => f.name === matchingPattern.fixName);

            if (fix) {
                if (!fixesByFile[filePath]) {
                    fixesByFile[filePath] = [];
                }

                // Add fix if not already added
                if (!fixesByFile[filePath].some(f => f.name === fix.name)) {
                    fixesByFile[filePath].push(fix);
                }
            }
        }
    }

    // Apply fixes to files
    let totalFixesApplied = 0;

    for (const [filePath, fixes] of Object.entries(fixesByFile)) {
        const fixesApplied = await applyFixes(filePath, fixes);
        totalFixesApplied += fixesApplied;
    }

    return totalFixesApplied;
}

// Proactively fix all TypeScript files
async function proactivelyFixFiles() {
    let totalFixesApplied = 0;

    // Find all TypeScript files
    const tsxFiles = await findFiles(ROOT_DIR, /\.(tsx|jsx)$/);
    const tsFiles = await findFiles(ROOT_DIR, /\.ts$/);
    const allFiles = [...tsxFiles, ...tsFiles];

    log(`Found ${allFiles.length} TypeScript files to check`);

    // Apply fixes to each file
    for (const filePath of allFiles) {
        const applicableFixes = typescriptFixes.filter(fix => {
            const filePattern = new RegExp(fix.filePattern);
            return filePattern.test(filePath);
        });

        const fixesApplied = await applyFixes(filePath, applicableFixes);
        totalFixesApplied += fixesApplied;
    }

    return totalFixesApplied;
}

// Add new fix patterns based on encountered errors
function learnNewFixPatterns(errors) {
    let newPatternsAdded = 0;

    for (const error of errors) {
        const { code, message } = error;

        // Check if we already have a pattern for this error
        const existingPattern = errorPatterns.some(pattern =>
            pattern.code === code && message.includes(pattern.message)
        );

        if (!existingPattern) {
            // For now, just log that we found a new error pattern
            log(`Found new error pattern: TS${code} - ${message}`);

            // In a more advanced version, we could try to generate a fix pattern
            // based on the error and add it to typescriptFixes

            newPatternsAdded++;
        }
    }

    return newPatternsAdded;
}

// Main function
async function main() {
    log('Starting Unified TypeScript Auto-Fix System');

    try {
        // First, proactively fix files
        const proactiveFixesApplied = await proactivelyFixFiles();
        log(`Applied ${proactiveFixesApplied} proactive fixes`);

        // Get remaining TypeScript errors
        const errors = await getTypeScriptErrors();
        log(`Found ${errors.length} TypeScript errors`);

        // Learn new fix patterns
        const newPatternsAdded = learnNewFixPatterns(errors);
        if (newPatternsAdded > 0) {
            log(`Identified ${newPatternsAdded} new error patterns`);
        }

        // Fix errors based on patterns
        const fixesApplied = await fixTypeScriptErrors(errors);
        log(`Applied ${fixesApplied} fixes based on error patterns`);

        // Get remaining errors after fixes
        const remainingErrors = await getTypeScriptErrors();
        log(`${remainingErrors.length} TypeScript errors remaining`);

        log('Unified TypeScript Auto-Fix System completed');
    } catch (error) {
        log(`Error in auto-fix system: ${error.message}`);
        log(error.stack);
    } finally {
        logger.end();
    }
}

// Run the main function
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
