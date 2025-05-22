#!/usr/bin/env node

/**
 * Auto-Learning System for TypeScript Auto-Fix
 *
 * This script analyzes TypeScript errors that couldn't be fixed by the auto-fix system,
 * identifies patterns, and automatically adds new fix strategies to the error-patterns.json file.
 *
 * The system becomes smarter over time by learning from previous runs and errors.
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';

// Configuration
const ERROR_PATTERNS_PATH = 'scripts/data/error-patterns.json';
const TYPESCRIPT_FIXES_PATH = 'scripts/data/typescript-fixes.json';
const LOGS_DIR = 'logs';
const MIN_OCCURRENCES = 3; // Minimum occurrences of a pattern to consider it for auto-learning

// Main function
async function autoLearn() {
    console.log('🧠 Starting Auto-Learning System for TypeScript Auto-Fix...');

    try {
        // Create logs directory if it doesn't exist
        await fs.mkdir(LOGS_DIR, { recursive: true });

        // Run TypeScript check to get current errors
        console.log('📊 Analyzing current TypeScript errors...');
        let tsErrors = [];
        try {
            execSync('npx tsc --noEmit', { stdio: 'pipe' });
            console.log('✅ No TypeScript errors found!');
            return; // No errors to learn from
        } catch (error) {
            const errorOutput = error.stdout.toString();
            tsErrors = parseTypeScriptErrors(errorOutput);
            console.log(`📋 Found ${tsErrors.length} TypeScript errors to analyze`);
        }

        // Load existing patterns
        const patterns = await loadPatterns();

        // Load fix history
        const fixHistory = await loadFixHistory();

        // Analyze errors and identify new patterns
        const newPatterns = identifyNewPatterns(tsErrors, patterns, fixHistory);

        if (newPatterns.length === 0) {
            console.log('ℹ️ No new patterns identified in this run');
            return;
        }

        // Add new patterns to the error-patterns.json file
        await addNewPatterns(patterns, newPatterns);

        console.log(`✅ Added ${newPatterns.length} new patterns to the error-patterns.json file`);
        console.log('🚀 The TypeScript Auto-Fix System is now smarter!');

        // Log the learning activity
        await logLearningActivity(newPatterns);
    } catch (error) {
        console.error('❌ Error in Auto-Learning System:', error.message);
    }
}

// Parse TypeScript errors from compiler output
function parseTypeScriptErrors(output) {
    const errors = [];
    const errorRegex = /([^:]+):(\d+):(\d+) - error (TS\d+): (.*)/g;
    let match;

    while ((match = errorRegex.exec(output)) !== null) {
        const [_, file, line, column, code, message] = match;
        errors.push({
            file,
            line: parseInt(line),
            column: parseInt(column),
            code,
            message
        });
    }

    return errors;
}

// Load existing patterns from error-patterns.json
async function loadPatterns() {
    try {
        const data = await fs.readFile(ERROR_PATTERNS_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('⚠️ Error loading patterns, creating new patterns file');
        const emptyPatterns = { patterns: {} };
        await fs.writeFile(ERROR_PATTERNS_PATH, JSON.stringify(emptyPatterns, null, 4));
        return emptyPatterns;
    }
}

// Load fix history from typescript-fixes.json
async function loadFixHistory() {
    try {
        const data = await fs.readFile(TYPESCRIPT_FIXES_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('⚠️ Error loading fix history, creating new history file');
        const emptyHistory = { fixes: {}, patterns: {}, stats: { runs: 0, totalFixed: 0 } };
        await fs.writeFile(TYPESCRIPT_FIXES_PATH, JSON.stringify(emptyHistory, null, 4));
        return emptyHistory;
    }
}

// Identify new patterns from errors
function identifyNewPatterns(errors, existingPatterns, fixHistory) {
    const newPatterns = [];
    const errorGroups = groupErrorsByCode(errors);

    for (const [code, codeErrors] of Object.entries(errorGroups)) {
        // Skip if we don't have enough occurrences
        if (codeErrors.length < MIN_OCCURRENCES) continue;

        // Analyze patterns for each error code
        const patterns = analyzeErrorPatterns(code, codeErrors, existingPatterns);

        // Add new patterns
        newPatterns.push(...patterns);
    }

    return newPatterns;
}

// Group errors by error code
function groupErrorsByCode(errors) {
    const groups = {};

    for (const error of errors) {
        if (!groups[error.code]) {
            groups[error.code] = [];
        }
        groups[error.code].push(error);
    }

    return groups;
}

// Analyze error patterns for a specific error code
function analyzeErrorPatterns(code, errors, existingPatterns) {
    const newPatterns = [];

    // Different analysis strategies based on error code
    switch (code) {
        case 'TS2339': // Property does not exist
            newPatterns.push(...analyzePropertyAccessErrors(code, errors, existingPatterns));
            break;
        case 'TS2322': // Type is not assignable
            newPatterns.push(...analyzeTypeAssignmentErrors(code, errors, existingPatterns));
            break;
        case 'TS7006': // Parameter implicitly has an 'any' type
            newPatterns.push(...analyzeParameterTypeErrors(code, errors, existingPatterns));
            break;
        case 'TS6133': // Variable is declared but never read
            newPatterns.push(...analyzeUnusedVariableErrors(code, errors, existingPatterns));
            break;
        case 'TS2614': // Module has no exported member
            newPatterns.push(...analyzeMissingExportErrors(code, errors, existingPatterns));
            break;
        case 'TS2724': // Module has no exported member named
            newPatterns.push(...analyzeMissingNamedExportErrors(code, errors, existingPatterns));
            break;
        case 'TS18046': // Variable is of type 'unknown'
            newPatterns.push(...analyzeUnknownTypeErrors(code, errors, existingPatterns));
            break;
    }

    return newPatterns;
}

// Analyze property access errors (TS2339)
function analyzePropertyAccessErrors(code, errors, existingPatterns) {
    const newPatterns = [];
    const existingPatternKeys = Object.keys(existingPatterns.patterns);

    // Extract property names from error messages
    const propertyRegex = /Property '([^']+)' does not exist on type '([^']+)'/;
    const properties = {};

    for (const error of errors) {
        const match = error.message.match(propertyRegex);
        if (match) {
            const [_, prop, type] = match;
            const key = `${code}_${prop}`;

            // Skip if pattern already exists
            if (existingPatternKeys.includes(key)) continue;

            if (!properties[key]) {
                properties[key] = { prop, type, count: 0, examples: [] };
            }

            properties[key].count++;

            // Get code example from file
            try {
                const fileContent = fs.readFileSync(error.file, 'utf8');
                const lines = fileContent.split('\n');
                const errorLine = lines[error.line - 1];
                properties[key].examples.push(errorLine.trim());
            } catch (e) {
                // Skip if file can't be read
            }
        }
    }

    // Create new patterns for properties with enough occurrences
    for (const [key, data] of Object.entries(properties)) {
        if (data.count >= MIN_OCCURRENCES) {
            newPatterns.push({
                key,
                pattern: {
                    description: `Missing ${data.prop} property on ${data.type}`,
                    solution: `Add interface extension for ${data.type}`,
                    examples: [...new Set(data.examples)].slice(0, 3) // Unique examples, max 3
                }
            });
        }
    }

    return newPatterns;
}

// Analyze type assignment errors (TS2322)
function analyzeTypeAssignmentErrors(code, errors, existingPatterns) {
    const newPatterns = [];
    const existingPatternKeys = Object.keys(existingPatterns.patterns);

    // Extract type information from error messages
    const typeRegex = /Type '([^']+)' is not assignable to type '([^']+)'/;
    const types = {};

    for (const error of errors) {
        const match = error.message.match(typeRegex);
        if (match) {
            const [_, sourceType, targetType] = match;
            let key = `${code}_${sourceType.replace(/[^a-zA-Z0-9]/g, '')}`;

            // Skip if pattern already exists
            if (existingPatternKeys.includes(key)) continue;

            if (!types[key]) {
                types[key] = { sourceType, targetType, count: 0, examples: [] };
            }

            types[key].count++;

            // Get code example from file
            try {
                const fileContent = fs.readFileSync(error.file, 'utf8');
                const lines = fileContent.split('\n');
                const errorLine = lines[error.line - 1];
                types[key].examples.push(errorLine.trim());
            } catch (e) {
                // Skip if file can't be read
            }
        }
    }

    // Create new patterns for types with enough occurrences
    for (const [key, data] of Object.entries(types)) {
        if (data.count >= MIN_OCCURRENCES) {
            newPatterns.push({
                key,
                pattern: {
                    description: `Type '${data.sourceType}' is not assignable to type '${data.targetType}'`,
                    solution: `Add type assertion or fix type assignment`,
                    examples: [...new Set(data.examples)].slice(0, 3) // Unique examples, max 3
                }
            });
        }
    }

    return newPatterns;
}

// Analyze parameter type errors (TS7006)
function analyzeParameterTypeErrors(code, errors, existingPatterns) {
    const newPatterns = [];
    const existingPatternKeys = Object.keys(existingPatterns.patterns);

    // Extract parameter names from error messages
    const paramRegex = /Parameter '([^']+)' implicitly has an 'any' type/;
    const params = {};

    for (const error of errors) {
        const match = error.message.match(paramRegex);
        if (match) {
            const [_, param] = match;
            const key = `${code}_${param}`;

            // Skip if pattern already exists
            if (existingPatternKeys.includes(key)) continue;

            if (!params[key]) {
                params[key] = { param, count: 0, examples: [] };
            }

            params[key].count++;

            // Get code example from file
            try {
                const fileContent = fs.readFileSync(error.file, 'utf8');
                const lines = fileContent.split('\n');
                const errorLine = lines[error.line - 1];
                params[key].examples.push(errorLine.trim());
            } catch (e) {
                // Skip if file can't be read
            }
        }
    }

    // Create new patterns for parameters with enough occurrences
    for (const [key, data] of Object.entries(params)) {
        if (data.count >= MIN_OCCURRENCES) {
            newPatterns.push({
                key,
                pattern: {
                    description: `Parameter '${data.param}' implicitly has an 'any' type`,
                    solution: `Add explicit type annotation`,
                    examples: [...new Set(data.examples)].slice(0, 3) // Unique examples, max 3
                }
            });
        }
    }

    return newPatterns;
}

// Analyze unused variable errors (TS6133)
function analyzeUnusedVariableErrors(code, errors, existingPatterns) {
    const newPatterns = [];
    const existingPatternKeys = Object.keys(existingPatterns.patterns);

    // Extract variable names from error messages
    const varRegex = /'([^']+)' is declared but its value is never read/;
    const vars = {};

    for (const error of errors) {
        const match = error.message.match(varRegex);
        if (match) {
            const [_, variable] = match;
            const key = `${code}_${variable}`;

            // Skip if pattern already exists
            if (existingPatternKeys.includes(key)) continue;

            if (!vars[key]) {
                vars[key] = { variable, count: 0, examples: [] };
            }

            vars[key].count++;

            // Get code example from file
            try {
                const fileContent = fs.readFileSync(error.file, 'utf8');
                const lines = fileContent.split('\n');
                const errorLine = lines[error.line - 1];
                vars[key].examples.push(errorLine.trim());
            } catch (e) {
                // Skip if file can't be read
            }
        }
    }

    // Create new patterns for variables with enough occurrences
    for (const [key, data] of Object.entries(vars)) {
        if (data.count >= MIN_OCCURRENCES) {
            newPatterns.push({
                key,
                pattern: {
                    description: `Variable '${data.variable}' is declared but never read`,
                    solution: `Prefix with underscore`,
                    examples: [...new Set(data.examples)].slice(0, 3) // Unique examples, max 3
                }
            });
        }
    }

    return newPatterns;
}

// Analyze missing export errors (TS2614)
function analyzeMissingExportErrors(code, errors, existingPatterns) {
    const newPatterns = [];
    const existingPatternKeys = Object.keys(existingPatterns.patterns);

    // Extract module and member names from error messages
    const exportRegex = /Module '([^']+)' has no exported member '([^']+)'/;
    const exports = {};

    for (const error of errors) {
        const match = error.message.match(exportRegex);
        if (match) {
            const [_, modulePath, member] = match;
            const key = `${code}_${member}`;

            // Skip if pattern already exists
            if (existingPatternKeys.includes(key)) continue;

            if (!exports[key]) {
                exports[key] = { modulePath, member, count: 0, examples: [] };
            }

            exports[key].count++;

            // Get code example from file
            try {
                const fileContent = fs.readFileSync(error.file, 'utf8');
                const lines = fileContent.split('\n');
                const errorLine = lines[error.line - 1];
                exports[key].examples.push(errorLine.trim());
            } catch (e) {
                // Skip if file can't be read
            }
        }
    }

    // Create new patterns for exports with enough occurrences
    for (const [key, data] of Object.entries(exports)) {
        if (data.count >= MIN_OCCURRENCES) {
            newPatterns.push({
                key,
                pattern: {
                    description: `Module has no exported member '${data.member}'`,
                    solution: `Change import style`,
                    examples: [...new Set(data.examples)].slice(0, 3) // Unique examples, max 3
                }
            });
        }
    }

    return newPatterns;
}

// Analyze missing named export errors (TS2724)
function analyzeMissingNamedExportErrors(code, errors, existingPatterns) {
    const newPatterns = [];
    const existingPatternKeys = Object.keys(existingPatterns.patterns);

    // Extract module and member names from error messages
    const exportRegex = /Module '([^']+)' has no exported member named '([^']+)'/;
    const exports = {};

    for (const error of errors) {
        const match = error.message.match(exportRegex);
        if (match) {
            const [_, modulePath, member] = match;
            const key = `${code}_${member}`;

            // Skip if pattern already exists
            if (existingPatternKeys.includes(key)) continue;

            if (!exports[key]) {
                exports[key] = { modulePath, member, count: 0, examples: [] };
            }

            exports[key].count++;

            // Get code example from file
            try {
                const fileContent = fs.readFileSync(error.file, 'utf8');
                const lines = fileContent.split('\n');
                const errorLine = lines[error.line - 1];
                exports[key].examples.push(errorLine.trim());
            } catch (e) {
                // Skip if file can't be read
            }
        }
    }

    // Create new patterns for exports with enough occurrences
    for (const [key, data] of Object.entries(exports)) {
        if (data.count >= MIN_OCCURRENCES) {
            newPatterns.push({
                key,
                pattern: {
                    description: `Module has no exported member named '${data.member}'`,
                    solution: `Change import to use renamed export`,
                    examples: [...new Set(data.examples)].slice(0, 3) // Unique examples, max 3
                }
            });
        }
    }

    return newPatterns;
}

// Analyze unknown type errors (TS18046)
function analyzeUnknownTypeErrors(code, errors, existingPatterns) {
    const newPatterns = [];
    const existingPatternKeys = Object.keys(existingPatterns.patterns);

    // Extract variable names from error messages
    const unknownRegex = /'([^']+)' is of type 'unknown'/;
    const unknowns = {};

    for (const error of errors) {
        const match = error.message.match(unknownRegex);
        if (match) {
            const [_, variable] = match;
            const key = `${code}_${variable}`;

            // Skip if pattern already exists
            if (existingPatternKeys.includes(key)) continue;

            if (!unknowns[key]) {
                unknowns[key] = { variable, count: 0, examples: [] };
            }

            unknowns[key].count++;

            // Get code example from file
            try {
                const fileContent = fs.readFileSync(error.file, 'utf8');
                const lines = fileContent.split('\n');
                const errorLine = lines[error.line - 1];
                unknowns[key].examples.push(errorLine.trim());
            } catch (e) {
                // Skip if file can't be read
            }
        }
    }

    // Create new patterns for variables with enough occurrences
    for (const [key, data] of Object.entries(unknowns)) {
        if (data.count >= MIN_OCCURRENCES) {
            newPatterns.push({
                key,
                pattern: {
                    description: `'${data.variable}' is of type 'unknown'`,
                    solution: `Add type assertion`,
                    examples: [...new Set(data.examples)].slice(0, 3) // Unique examples, max 3
                }
            });
        }
    }

    return newPatterns;
}

// Add new patterns to the error-patterns.json file
async function addNewPatterns(patterns, newPatterns) {
    for (const { key, pattern } of newPatterns) {
        patterns.patterns[key] = pattern;
    }

    await fs.writeFile(ERROR_PATTERNS_PATH, JSON.stringify(patterns, null, 4));
}

// Log learning activity
async function logLearningActivity(newPatterns) {
    const timestamp = new Date().toISOString();
    const logFile = path.join(LOGS_DIR, `auto-learning-${timestamp.replace(/:/g, '-')}.log`);

    let logContent = `Auto-Learning System Activity - ${timestamp}\n`;
    logContent += '='.repeat(50) + '\n\n';
    logContent += `Added ${newPatterns.length} new patterns:\n\n`;

    for (const { key, pattern } of newPatterns) {
        logContent += `Pattern: ${key}\n`;
        logContent += `Description: ${pattern.description}\n`;
        logContent += `Solution: ${pattern.solution}\n`;
        logContent += 'Examples:\n';
        for (const example of pattern.examples) {
            logContent += `  - ${example}\n`;
        }
        logContent += '\n';
    }

    await fs.writeFile(logFile, logContent);
    console.log(`📝 Learning activity logged to ${logFile}`);
}

// Run the auto-learning system
autoLearn().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
});
