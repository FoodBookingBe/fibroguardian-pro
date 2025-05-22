#!/usr/bin/env node

/**
 * Unified Auto-Fix System
 *
 * This script integrates all auto-fix components into a single, intelligent system
 * that can automatically fix TypeScript errors, learn from previous fixes, and
 * continuously improve over time.
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

// Configuration
const DEBUG = process.argv.includes('--debug');
const LOGS_DIR = 'logs';
const ERROR_PATTERNS_PATH = 'scripts/data/error-patterns.json';
const TYPESCRIPT_FIXES_PATH = 'scripts/data/typescript-fixes.json';
const ADVANCED_ERROR_PATTERNS_PATH = 'scripts/data/advanced-error-patterns.json';
const ADVANCED_FIXES_HISTORY_PATH = 'scripts/data/advanced-fixes-history.json';
const SPECIFIC_FIXES_PATH = 'scripts/data/specific-fixes.json';
const LEARNING_THRESHOLD = 2; // Number of times an error must occur to be learned

// Main function
async function main() {
    console.log('🧠 Starting Unified Auto-Fix System...');

    try {
        // Create logs directory if it doesn't exist
        await fs.mkdir(LOGS_DIR, { recursive: true }).catch(() => { });

        // Log start time
        const startTime = new Date();
        const logFile = path.join(LOGS_DIR, `unified-auto-fix-${startTime.toISOString().replace(/:/g, '-')}.log`);
        await fs.writeFile(logFile, `Unified Auto-Fix System started at ${startTime.toISOString()}\n\n`);

        // Initialize error patterns and fixes
        const errorPatterns = await loadOrCreateJSON(ERROR_PATTERNS_PATH, {});
        const typescriptFixes = await loadOrCreateJSON(TYPESCRIPT_FIXES_PATH, {});
        const advancedErrorPatterns = await loadOrCreateJSON(ADVANCED_ERROR_PATTERNS_PATH, {});
        const advancedFixesHistory = await loadOrCreateJSON(ADVANCED_FIXES_HISTORY_PATH, {});
        const specificFixes = await loadOrCreateJSON(SPECIFIC_FIXES_PATH, {});

        // Step 1: Run TypeScript to get current errors
        console.log('🔍 Running TypeScript to identify errors...');
        const initialErrors = await getTypeScriptErrors();
        const initialErrorCount = initialErrors.length;
        console.log(`Found ${initialErrorCount} TypeScript errors`);
        await fs.appendFile(logFile, `Initial error count: ${initialErrorCount}\n`);

        // Step 2: Run basic TypeScript fixer
        console.log('🔧 Running basic TypeScript fixer...');
        await runBasicTypescriptFixer();

        // Step 3: Run type assertions fixer
        console.log('🔧 Running type assertions fixer...');
        await runTypeAssertionsFixer();

        // Step 4: Run advanced type fixer
        console.log('🔧 Running advanced type fixer...');
        await runAdvancedTypeFixer();

        // Step 5: Run specific error fixer
        console.log('🔧 Running specific error fixer...');
        await runSpecificErrorFixer();

        // Step 6: Run enhanced specific error fixer
        console.log('🔧 Running enhanced specific error fixer...');
        await runEnhancedSpecificErrorFixer();

        // Step 6: Get remaining errors
        console.log('🔍 Checking for remaining errors...');
        const remainingErrors = await getTypeScriptErrors();
        const remainingErrorCount = remainingErrors.length;
        console.log(`${remainingErrorCount} TypeScript errors remain`);
        await fs.appendFile(logFile, `Remaining error count: ${remainingErrorCount}\n`);

        // Step 7: Learn from remaining errors
        if (remainingErrorCount > 0) {
            console.log('🧠 Learning from remaining errors...');
            await learnFromErrors(remainingErrors, errorPatterns, typescriptFixes, advancedErrorPatterns, specificFixes);

            // Save updated patterns and fixes
            await fs.writeFile(ERROR_PATTERNS_PATH, JSON.stringify(errorPatterns, null, 2));
            await fs.writeFile(TYPESCRIPT_FIXES_PATH, JSON.stringify(typescriptFixes, null, 2));
            await fs.writeFile(ADVANCED_ERROR_PATTERNS_PATH, JSON.stringify(advancedErrorPatterns, null, 2));
            await fs.writeFile(SPECIFIC_FIXES_PATH, JSON.stringify(specificFixes, null, 2));

            console.log('✅ Learning complete');
        }

        // Step 8: Generate report
        const fixedErrorCount = initialErrorCount - remainingErrorCount;
        const fixRate = initialErrorCount > 0 ? (fixedErrorCount / initialErrorCount) * 100 : 0;

        console.log(`\n📊 Auto-Fix Report:`);
        console.log(`Initial errors: ${initialErrorCount}`);
        console.log(`Fixed errors: ${fixedErrorCount}`);
        console.log(`Remaining errors: ${remainingErrorCount}`);
        console.log(`Fix rate: ${fixRate.toFixed(2)}%`);

        await fs.appendFile(logFile, `\nAuto-Fix Report:\n`);
        await fs.appendFile(logFile, `Initial errors: ${initialErrorCount}\n`);
        await fs.appendFile(logFile, `Fixed errors: ${fixedErrorCount}\n`);
        await fs.appendFile(logFile, `Remaining errors: ${remainingErrorCount}\n`);
        await fs.appendFile(logFile, `Fix rate: ${fixRate.toFixed(2)}%\n`);

        // Step 9: Generate recommendations for remaining errors
        if (remainingErrorCount > 0) {
            console.log('\n📋 Recommendations for remaining errors:');
            const recommendations = generateRecommendations(remainingErrors);
            console.log(recommendations);
            await fs.appendFile(logFile, `\nRecommendations for remaining errors:\n${recommendations}\n`);
        }

        // Log end time
        const endTime = new Date();
        const duration = (endTime - startTime) / 1000;
        await fs.appendFile(logFile, `\nUnified Auto-Fix System completed at ${endTime.toISOString()}\n`);
        await fs.appendFile(logFile, `Duration: ${duration} seconds\n`);

        console.log(`\n✅ Unified Auto-Fix System completed in ${duration} seconds`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Helper function to load or create JSON file
async function loadOrCreateJSON(filePath, defaultValue) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        // Create directory if it doesn't exist
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true }).catch(() => { });

        // Create file with default value
        await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
        return defaultValue;
    }
}

// Get TypeScript errors
async function getTypeScriptErrors() {
    try {
        // Run TypeScript compiler with --noEmit flag to check for errors
        execSync('npx tsc --noEmit', { stdio: 'pipe' });
        return []; // No errors
    } catch (error) {
        // Parse error output
        const errorOutput = error.stdout.toString();
        const errors = [];

        // Regular expression to match TypeScript errors
        const errorRegex = /(.+)\((\d+),(\d+)\): error TS(\d+): (.+)/g;
        let match;

        while ((match = errorRegex.exec(errorOutput)) !== null) {
            const [, filePath, line, column, code, message] = match;
            errors.push({
                filePath: filePath.trim(),
                line: parseInt(line),
                column: parseInt(column),
                code: parseInt(code),
                message: message.trim()
            });
        }

        return errors;
    }
}

// Run basic TypeScript fixer
async function runBasicTypescriptFixer() {
    try {
        execSync('node scripts/fix-typescript.js', { stdio: 'pipe' });
        return true;
    } catch (error) {
        console.error('Error running basic TypeScript fixer:', error.message);
        return false;
    }
}

// Run type assertions fixer
async function runTypeAssertionsFixer() {
    try {
        execSync('node scripts/fix-type-assertions.js', { stdio: 'pipe' });
        return true;
    } catch (error) {
        console.error('Error running type assertions fixer:', error.message);
        return false;
    }
}

// Run advanced type fixer
async function runAdvancedTypeFixer() {
    try {
        execSync('node scripts/advanced-type-fixer.js', { stdio: 'pipe' });
        return true;
    } catch (error) {
        console.error('Error running advanced type fixer:', error.message);
        return false;
    }
}

// Run specific error fixer
async function runSpecificErrorFixer() {
    try {
        execSync('node scripts/fix-specific-errors.js', { stdio: 'pipe' });
        return true;
    } catch (error) {
        console.error('Error running specific error fixer:', error.message);
        return false;
    }
}

// Run enhanced specific error fixer
async function runEnhancedSpecificErrorFixer() {
    try {
        execSync('node scripts/enhanced-specific-errors.js', { stdio: 'pipe' });
        return true;
    } catch (error) {
        console.error('Error running enhanced specific error fixer:', error.message);
        return false;
    }
}

// Learn from errors
async function learnFromErrors(errors, errorPatterns, typescriptFixes, advancedErrorPatterns, specificFixes) {
    // Group errors by code
    const errorsByCode = {};
    for (const error of errors) {
        if (!errorsByCode[error.code]) {
            errorsByCode[error.code] = [];
        }
        errorsByCode[error.code].push(error);
    }

    // Learn from each error code
    for (const [code, codeErrors] of Object.entries(errorsByCode)) {
        // Group errors by message pattern
        const errorsByPattern = {};
        for (const error of codeErrors) {
            // Simplify message to create a pattern
            const pattern = simplifyErrorMessage(error.message);
            if (!errorsByPattern[pattern]) {
                errorsByPattern[pattern] = [];
            }
            errorsByPattern[pattern].push(error);
        }

        // Learn from each pattern
        for (const [pattern, patternErrors] of Object.entries(errorsByPattern)) {
            if (patternErrors.length >= LEARNING_THRESHOLD) {
                // This pattern occurs frequently enough to learn from
                const patternKey = `TS${code}_${pattern}`;

                // Check if we already have a fix for this pattern
                if (!errorPatterns[patternKey]) {
                    // Create a new pattern
                    errorPatterns[patternKey] = {
                        description: `TypeScript error TS${code}: ${pattern}`,
                        regex: pattern,
                        solution: generateSolutionForPattern(code, pattern, patternErrors),
                        examples: patternErrors.slice(0, 3).map(error => ({
                            file: error.filePath,
                            line: error.line,
                            message: error.message
                        }))
                    };

                    console.log(`🧠 Learned new pattern: ${patternKey}`);
                }

                // Check if we need to create a specific fix for this file
                const fileGroups = groupErrorsByFile(patternErrors);
                for (const [filePath, fileErrors] of Object.entries(fileGroups)) {
                    if (fileErrors.length >= LEARNING_THRESHOLD) {
                        // This file has multiple errors of the same pattern
                        const fileKey = `${filePath}_TS${code}`;
                        if (!specificFixes[fileKey]) {
                            specificFixes[fileKey] = {
                                filePath,
                                errorCode: code,
                                pattern,
                                fixStrategy: generateFixStrategyForFile(filePath, code, pattern, fileErrors),
                                examples: fileErrors.slice(0, 3).map(error => ({
                                    line: error.line,
                                    message: error.message
                                }))
                            };

                            console.log(`🧠 Created specific fix for file: ${filePath}`);
                        }
                    }
                }
            }
        }
    }
}

// Simplify error message to create a pattern
function simplifyErrorMessage(message) {
    return message
        .replace(/['"][^'"]+['"]/g, "'VALUE'") // Replace string literals
        .replace(/\d+/g, "NUM") // Replace numbers
        .replace(/\{[^}]+\}/g, "{OBJ}") // Replace object literals
        .replace(/\[[^\]]+\]/g, "[ARR]") // Replace array literals
        .replace(/\([^)]+\)/g, "(ARGS)") // Replace function arguments
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim();
}

// Generate solution for pattern
function generateSolutionForPattern(code, pattern, errors) {
    // Different strategies based on error code
    switch (parseInt(code)) {
        case 2339: // Property does not exist
            return "Add the missing property to the interface or type, or use optional chaining (obj?.prop)";
        case 2322: // Type assignment error
            return "Add type assertion (as Type) or fix the type assignment";
        case 7006: // Implicit any type
            return "Add explicit type annotation to the parameter";
        case 2345: // Argument type error
            return "Add type assertion or fix the argument type";
        case 2554: // Expected n arguments, but got m
            return "Fix the number of arguments in the function call";
        case 2741: // Property is missing in type but required in type
            return "Add the missing property to the object";
        case 18046: // Object is of type 'unknown'
            return "Add type assertion (as Type) or use type guard";
        case 2532: // Object is possibly 'undefined'
            return "Add null check or use optional chaining (obj?.prop)";
        case 2724: // Module has no exported member
            return "Fix the import statement or export the member from the module";
        case 71004: // 'use client' directive must be at the top
            return "Move 'use client' directive to the top of the file";
        default:
            return "Review the error and fix manually";
    }
}

// Generate fix strategy for file
function generateFixStrategyForFile(filePath, code, pattern, errors) {
    // Different strategies based on file type and error code
    const fileExt = path.extname(filePath);

    if (fileExt === '.tsx' || fileExt === '.jsx') {
        // React component file
        switch (parseInt(code)) {
            case 2339: // Property does not exist
                return "Add prop type definition or use optional chaining";
            case 7006: // Implicit any type
                return "Add explicit type for event handlers (e: React.ChangeEvent<HTMLInputElement>)";
            case 71004: // 'use client' directive must be at the top
                return "Move 'use client' directive to the top of the file";
            case 18046: // Object is of type 'unknown'
                return "Add type assertion for event objects (e as React.MouseEvent)";
            default:
                return "Review React component and fix type issues";
        }
    } else if (fileExt === '.ts') {
        // TypeScript file
        switch (parseInt(code)) {
            case 2339: // Property does not exist
                return "Add interface extension or use optional chaining";
            case 2322: // Type assignment error
                return "Fix type assignment or add type assertion";
            case 2724: // Module has no exported member
                return "Fix export name in the module";
            default:
                return "Review TypeScript code and fix type issues";
        }
    }

    return "Review the file and fix manually";
}

// Group errors by file
function groupErrorsByFile(errors) {
    const fileGroups = {};
    for (const error of errors) {
        if (!fileGroups[error.filePath]) {
            fileGroups[error.filePath] = [];
        }
        fileGroups[error.filePath].push(error);
    }
    return fileGroups;
}

// Generate recommendations for remaining errors
function generateRecommendations(errors) {
    // Group errors by file
    const fileGroups = groupErrorsByFile(errors);

    // Generate recommendations
    let recommendations = '';

    // Files with the most errors
    const filesSorted = Object.entries(fileGroups)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 10);

    recommendations += '1. Files with the most errors:\n';
    for (const [filePath, fileErrors] of filesSorted) {
        recommendations += `   - ${filePath}: ${fileErrors.length} errors\n`;
    }

    // Most common error types
    const errorsByCode = {};
    for (const error of errors) {
        if (!errorsByCode[error.code]) {
            errorsByCode[error.code] = [];
        }
        errorsByCode[error.code].push(error);
    }

    const codesSorted = Object.entries(errorsByCode)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 10);

    recommendations += '\n2. Most common error types:\n';
    for (const [code, codeErrors] of codesSorted) {
        const sampleError = codeErrors[0];
        recommendations += `   - TS${code} (${codeErrors.length} occurrences): ${sampleError.message}\n`;
        recommendations += `     Recommendation: ${generateSolutionForPattern(code, '', codeErrors)}\n`;
    }

    // Specific recommendations for top files
    recommendations += '\n3. Specific recommendations for top files:\n';
    for (const [filePath, fileErrors] of filesSorted.slice(0, 5)) {
        recommendations += `   - ${filePath}:\n`;

        // Group errors by code
        const fileErrorsByCode = {};
        for (const error of fileErrors) {
            if (!fileErrorsByCode[error.code]) {
                fileErrorsByCode[error.code] = [];
            }
            fileErrorsByCode[error.code].push(error);
        }

        // Top 3 error types for this file
        const fileCodesSorted = Object.entries(fileErrorsByCode)
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 3);

        for (const [code, codeErrors] of fileCodesSorted) {
            recommendations += `     - TS${code} (${codeErrors.length} occurrences): ${generateFixStrategyForFile(filePath, code, '', codeErrors)}\n`;
        }
    }

    return recommendations;
}

// Run the script
main().catch(error => {
    console.error('❌ Error:', error.message);
    if (DEBUG) {
        console.error(error.stack);
    }
    process.exit(1);
});
