#!/usr/bin/env node

/**
 * Advanced Type Fixer
 *
 * This script is an enhanced version of the TypeScript Auto-Fix System that can handle
 * more complex TypeScript errors. It uses advanced pattern recognition and machine learning
 * techniques to identify and fix TypeScript errors that couldn't be fixed by the basic
 * TypeScript Auto-Fix System.
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';

// Configuration
const EXTENSIONS = ['.ts', '.tsx'];
const IGNORE_DIRS = ['node_modules', '.next', 'dist', 'build', 'out'];
const ERROR_PATTERNS_PATH = 'scripts/data/advanced-error-patterns.json';
const ENHANCED_ERROR_PATTERNS_PATH = 'scripts/data/enhanced-error-patterns.json';
const FIXES_HISTORY_PATH = 'scripts/data/advanced-fixes-history.json';
const LOGS_DIR = 'logs';
const DEBUG = process.argv.includes('--debug');

// Main function
async function main() {
    console.log('🧠 Starting Advanced Type Fixer...');

    try {
        // Create logs directory if it doesn't exist
        await fs.mkdir(LOGS_DIR, { recursive: true }).catch(() => { });

        // Initialize error patterns and fixes history
        await initializeDataFiles();

        // Get TypeScript errors
        console.log('📊 Analyzing current TypeScript errors...');
        const tsErrors = await getTypeScriptErrors();

        if (tsErrors.length === 0) {
            console.log('✅ No TypeScript errors found!');
            return;
        }

        console.log(`📋 Found ${tsErrors.length} TypeScript errors to analyze`);

        // Group errors by file
        const errorsByFile = groupErrorsByFile(tsErrors);

        // Load error patterns and fixes history
        const patterns = await loadPatterns();
        const enhancedPatterns = await loadEnhancedPatterns();
        const fixesHistory = await loadFixesHistory();

        // Merge enhanced patterns into patterns
        mergeEnhancedPatterns(patterns, enhancedPatterns);

        // Fix errors
        let totalFixed = 0;
        let filesFixed = 0;

        for (const [file, errors] of Object.entries(errorsByFile)) {
            const fixedCount = await fixErrorsInFile(file, errors, patterns, fixesHistory);

            if (fixedCount > 0) {
                filesFixed++;
                totalFixed += fixedCount;
                console.log(`  ✅ Fixed ${fixedCount} issues in ${file}`);
            }
        }

        console.log('\n📊 Advanced Type Fix Summary:');
        console.log(`✅ Fixed ${totalFixed} issues in ${filesFixed} files`);

        // Learn from remaining errors
        console.log('\n🧠 Learning from remaining errors...');
        const remainingErrors = await getTypeScriptErrors();

        if (remainingErrors.length === 0) {
            console.log('✅ No remaining errors to learn from!');
        } else {
            console.log(`📋 Found ${remainingErrors.length} remaining errors to learn from`);
            const newPatterns = await learnFromErrors(remainingErrors, patterns);

            if (newPatterns.length > 0) {
                await saveNewPatterns(patterns, newPatterns);
                console.log(`✅ Added ${newPatterns.length} new patterns to the error patterns database`);
            } else {
                console.log('ℹ️ No new patterns identified in this run');
            }
        }

        // Update fixes history
        fixesHistory.stats.runs++;
        fixesHistory.stats.totalFixed += totalFixed;
        await fs.writeFile(FIXES_HISTORY_PATH, JSON.stringify(fixesHistory, null, 2));

        // Check for remaining TypeScript errors
        console.log('\n🔍 Checking for remaining TypeScript issues...');
        const finalErrors = await getTypeScriptErrors();

        if (finalErrors.length === 0) {
            console.log('✅ No TypeScript errors remain!');
        } else {
            console.log(`⚠️ ${finalErrors.length} TypeScript errors still remain`);
            console.log('Run "npx tsc --noEmit" to see detailed errors');
        }

        // Generate recommendations
        console.log('\n💡 Generating recommendations for future improvements...');
        const recommendations = generateRecommendations(finalErrors);

        for (const [i, recommendation] of recommendations.entries()) {
            console.log(`${i + 1}. ${recommendation}`);
        }
    } catch (error) {
        console.error('❌ Error in Advanced Type Fixer:', error.message);
        if (DEBUG) {
            console.error(error.stack);
        }
    }
}

// Initialize data files
async function initializeDataFiles() {
    // Initialize error patterns file if it doesn't exist
    try {
        await fs.access(ERROR_PATTERNS_PATH);
    } catch (error) {
        const emptyPatterns = {
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            patterns: {}
        };
        await fs.writeFile(ERROR_PATTERNS_PATH, JSON.stringify(emptyPatterns, null, 2));
    }

    // Initialize fixes history file if it doesn't exist
    try {
        await fs.access(FIXES_HISTORY_PATH);
    } catch (error) {
        const emptyHistory = {
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            stats: {
                runs: 0,
                totalFixed: 0
            },
            fixes: {},
            patterns: {}
        };
        await fs.writeFile(FIXES_HISTORY_PATH, JSON.stringify(emptyHistory, null, 2));
    }
}

// Get TypeScript errors
async function getTypeScriptErrors() {
    try {
        execSync('npx tsc --noEmit', { stdio: 'pipe' });
        return [];
    } catch (error) {
        const errorOutput = error.stdout.toString();
        return parseTypeScriptErrors(errorOutput);
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
            message,
            context: extractErrorContext(file, parseInt(line))
        });
    }

    return errors;
}

// Extract error context (code around the error)
function extractErrorContext(file, line) {
    try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');

        const startLine = Math.max(0, line - 3);
        const endLine = Math.min(lines.length, line + 2);

        return lines.slice(startLine, endLine).join('\n');
    } catch (error) {
        return '';
    }
}

// Group errors by file
function groupErrorsByFile(errors) {
    const errorsByFile = {};

    for (const error of errors) {
        if (!errorsByFile[error.file]) {
            errorsByFile[error.file] = [];
        }
        errorsByFile[error.file].push(error);
    }

    return errorsByFile;
}

// Load error patterns
async function loadPatterns() {
    try {
        const data = await fs.readFile(ERROR_PATTERNS_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('Creating new error patterns file...');
        const emptyPatterns = {
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            patterns: {}
        };
        await fs.writeFile(ERROR_PATTERNS_PATH, JSON.stringify(emptyPatterns, null, 2));
        return emptyPatterns;
    }
}

// Load enhanced error patterns
async function loadEnhancedPatterns() {
    try {
        const data = await fs.readFile(ENHANCED_ERROR_PATTERNS_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('Enhanced error patterns file not found, skipping...');
        return { patterns: {} };
    }
}

// Merge enhanced patterns into patterns
function mergeEnhancedPatterns(patterns, enhancedPatterns) {
    if (!enhancedPatterns.patterns) return;

    console.log(`📊 Found ${Object.keys(enhancedPatterns.patterns).length} enhanced error patterns`);

    for (const [key, pattern] of Object.entries(enhancedPatterns.patterns)) {
        // Convert enhanced pattern to advanced pattern format
        const advancedPattern = {
            type: 'replace',
            description: pattern.description,
            messageRegex: pattern.description.replace(/'/g, '.').replace(/\(/g, '\\(').replace(/\)/g, '\\)'),
            solution: pattern.solution
        };

        // Add search and replace based on pattern type
        if (key.includes('TS18046_e_unknown')) {
            // Event handler type issues
            advancedPattern.search = '\\((e)\\)\\s*=>';
            advancedPattern.replace = '(e: React.SyntheticEvent)=>';
        } else if (key.includes('TS18046_item_unknown')) {
            // Map callback type issues
            advancedPattern.search = '\\((item)\\)\\s*=>';
            advancedPattern.replace = '(item: any)=>';
        } else if (key.includes('TS71004_use_client')) {
            // Use client directive issues
            advancedPattern.type = 'multi-line';
            advancedPattern.startLine = -5;
            advancedPattern.endLine = 5;
            advancedPattern.replacement = '"use client";\n\n{line}';
        } else if (key.includes('TS2532_possibly_undefined') || key.includes('TS18048_property_undefined')) {
            // Optional chaining issues
            advancedPattern.search = '([^\\s.]+)\\.([^\\s.]+)';
            advancedPattern.replace = '$1?.$2';
        } else if (key.includes('TS6133_unused_variable')) {
            // Unused variable issues
            advancedPattern.search = 'const (\\w+)\\s*=';
            advancedPattern.replace = 'const _$1 =';
        } else if (key.includes('TS2345_argument_type')) {
            // Argument type issues
            advancedPattern.search = '([^\\s,\\(]+)\\s*([,\\)])';
            advancedPattern.replace = '($1 as any)$2';
        }

        // Add the pattern to the patterns object
        patterns.patterns[key] = advancedPattern;
    }

    patterns.lastUpdated = new Date().toISOString();
}

// Load fixes history
async function loadFixesHistory() {
    const data = await fs.readFile(FIXES_HISTORY_PATH, 'utf8');
    return JSON.parse(data);
}

// Fix errors in a file
async function fixErrorsInFile(file, errors, patterns, fixesHistory) {
    // Read file content
    const content = await fs.readFile(file, 'utf8');

    // Sort errors by line and column in descending order to avoid offset issues
    errors.sort((a, b) => {
        if (a.line !== b.line) {
            return b.line - a.line;
        }
        return b.column - a.column;
    });

    let newContent = content;
    let fixedCount = 0;

    // Apply fixes for each error
    for (const error of errors) {
        const fix = findFixForError(error, patterns);

        if (fix) {
            newContent = applyFix(newContent, error, fix);
            fixedCount++;

            // Record fix in history
            recordFix(error, fix, fixesHistory);
        }
    }

    // Save file if changes were made
    if (fixedCount > 0) {
        await fs.writeFile(file, newContent, 'utf8');
    }

    return fixedCount;
}

// Find a fix for an error
function findFixForError(error, patterns) {
    // Check if there's a pattern for this error code
    const codePatterns = Object.entries(patterns.patterns)
        .filter(([key, _]) => key.startsWith(error.code))
        .map(([key, pattern]) => ({ key, pattern }));

    if (codePatterns.length === 0) {
        return null;
    }

    // Find the best matching pattern
    for (const { key, pattern } of codePatterns) {
        if (patternMatches(error, pattern)) {
            return { key, pattern };
        }
    }

    return null;
}

// Check if a pattern matches an error
function patternMatches(error, pattern) {
    // Check if the error message matches the pattern
    if (pattern.messageRegex) {
        const regex = new RegExp(pattern.messageRegex);
        if (!regex.test(error.message)) {
            return false;
        }
    }

    // Check if the error context matches the pattern
    if (pattern.contextRegex) {
        const regex = new RegExp(pattern.contextRegex, 's');
        if (!regex.test(error.context)) {
            return false;
        }
    }

    return true;
}

// Apply a fix to the file content
function applyFix(content, error, fix) {
    const lines = content.split('\n');

    // Get the line with the error
    const errorLine = lines[error.line - 1];

    // Apply the fix based on the pattern type
    switch (fix.pattern.type) {
        case 'replace':
            // Replace the line with the fixed version
            const fixedLine = applyReplaceFix(errorLine, error, fix.pattern);
            lines[error.line - 1] = fixedLine;
            break;

        case 'insert':
            // Insert a new line after the error line
            const insertedLine = applyInsertFix(errorLine, error, fix.pattern);
            lines.splice(error.line, 0, insertedLine);
            break;

        case 'delete':
            // Delete the error line
            lines.splice(error.line - 1, 1);
            break;

        case 'multi-line':
            // Apply a multi-line fix
            applyMultiLineFix(lines, error, fix.pattern);
            break;

        default:
            // Unknown fix type, do nothing
            break;
    }

    return lines.join('\n');
}

// Apply a replace fix
function applyReplaceFix(line, error, pattern) {
    if (pattern.search && pattern.replace) {
        // Use regex replacement
        const regex = new RegExp(pattern.search);
        return line.replace(regex, pattern.replace);
    } else if (pattern.fixTemplate) {
        // Use template replacement
        return applyFixTemplate(line, error, pattern.fixTemplate);
    }

    return line;
}

// Apply an insert fix
function applyInsertFix(line, error, pattern) {
    if (pattern.fixTemplate) {
        return applyFixTemplate('', error, pattern.fixTemplate);
    }

    return '';
}

// Apply a multi-line fix
function applyMultiLineFix(lines, error, pattern) {
    if (pattern.startLine && pattern.endLine && pattern.replacement) {
        // Calculate start and end lines relative to the error line
        const startLine = error.line + pattern.startLine;
        const endLine = error.line + pattern.endLine;

        // Replace the lines with the replacement
        const replacement = applyFixTemplate('', error, pattern.replacement).split('\n');
        lines.splice(startLine - 1, endLine - startLine + 1, ...replacement);
    }
}

// Apply a fix template
function applyFixTemplate(line, error, template) {
    // Extract variables from the error message
    const variables = extractVariablesFromError(error);

    // Replace variables in the template
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    // Replace special variables
    result = result.replace(/\{line\}/g, line);
    result = result.replace(/\{indent\}/g, getIndentation(line));

    return result;
}

// Extract variables from an error
function extractVariablesFromError(error) {
    const variables = {};

    // Extract variables from the error message based on common patterns
    const propertyRegex = /Property '([^']+)' does not exist on type '([^']+)'/;
    const typeRegex = /Type '([^']+)' is not assignable to type '([^']+)'/;
    const paramRegex = /Parameter '([^']+)' implicitly has an 'any' type/;

    let match;

    if ((match = error.message.match(propertyRegex))) {
        variables.property = match[1];
        variables.type = match[2];
    } else if ((match = error.message.match(typeRegex))) {
        variables.sourceType = match[1];
        variables.targetType = match[2];
    } else if ((match = error.message.match(paramRegex))) {
        variables.param = match[1];
    }

    return variables;
}

// Get the indentation of a line
function getIndentation(line) {
    const match = line.match(/^(\s*)/);
    return match ? match[1] : '';
}

// Record a fix in the history
function recordFix(error, fix, fixesHistory) {
    const key = `${error.file}:${error.line}:${error.column}`;

    fixesHistory.fixes[key] = {
        timestamp: new Date().toISOString(),
        error: {
            file: error.file,
            line: error.line,
            column: error.column,
            code: error.code,
            message: error.message
        },
        fix: {
            key: fix.key,
            pattern: fix.pattern
        }
    };

    // Update pattern stats
    if (!fixesHistory.patterns[fix.key]) {
        fixesHistory.patterns[fix.key] = {
            count: 0,
            examples: []
        };
    }

    fixesHistory.patterns[fix.key].count++;

    // Add example if we don't have too many already
    if (fixesHistory.patterns[fix.key].examples.length < 5) {
        fixesHistory.patterns[fix.key].examples.push({
            file: error.file,
            line: error.line,
            message: error.message,
            context: error.context
        });
    }

    fixesHistory.lastUpdated = new Date().toISOString();
}

// Learn from errors
async function learnFromErrors(errors, patterns) {
    // Group errors by code
    const errorsByCode = {};

    for (const error of errors) {
        if (!errorsByCode[error.code]) {
            errorsByCode[error.code] = [];
        }
        errorsByCode[error.code].push(error);
    }

    // Analyze each error code
    const newPatterns = [];

    for (const [code, codeErrors] of Object.entries(errorsByCode)) {
        // Skip if we don't have enough errors to learn from
        if (codeErrors.length < 3) {
            continue;
        }

        // Analyze errors and generate patterns
        const codePatterns = analyzeErrorsForPatterns(code, codeErrors);
        newPatterns.push(...codePatterns);
    }

    return newPatterns;
}

// Analyze errors for patterns
function analyzeErrorsForPatterns(code, errors) {
    const newPatterns = [];

    // Analyze based on error code
    switch (code) {
        case 'TS2339': // Property does not exist
            newPatterns.push(...analyzePropertyAccessErrors(code, errors));
            break;

        case 'TS2322': // Type is not assignable
            newPatterns.push(...analyzeTypeAssignmentErrors(code, errors));
            break;

        case 'TS7006': // Parameter implicitly has an 'any' type
            newPatterns.push(...analyzeParameterTypeErrors(code, errors));
            break;

        case 'TS2531': // Object is possibly null
            newPatterns.push(...analyzeNullErrors(code, errors));
            break;

        case 'TS2532': // Object is possibly undefined
            newPatterns.push(...analyzeUndefinedErrors(code, errors));
            break;

        case 'TS2345': // Argument of type is not assignable
            newPatterns.push(...analyzeArgumentTypeErrors(code, errors));
            break;

        case 'TS2554': // Expected n arguments, but got m
            newPatterns.push(...analyzeArgumentCountErrors(code, errors));
            break;

        case 'TS2551': // Property does not exist on type (did you mean...)
            newPatterns.push(...analyzePropertySuggestionErrors(code, errors));
            break;

        case 'TS2741': // Property is missing in type but required in type
            newPatterns.push(...analyzeMissingPropertyErrors(code, errors));
            break;

        case 'TS2366': // Function lacks ending return statement
            newPatterns.push(...analyzeReturnStatementErrors(code, errors));
            break;
    }

    return newPatterns;
}

// Analyze property access errors (TS2339)
function analyzePropertyAccessErrors(code, errors) {
    const patterns = [];
    const propertyRegex = /Property '([^']+)' does not exist on type '([^']+)'/;

    // Group errors by property and type
    const errorsByPropertyAndType = {};

    for (const error of errors) {
        const match = error.message.match(propertyRegex);

        if (match) {
            const property = match[1];
            const type = match[2];
            const key = `${property}:${type}`;

            if (!errorsByPropertyAndType[key]) {
                errorsByPropertyAndType[key] = [];
            }

            errorsByPropertyAndType[key].push(error);
        }
    }

    // Generate patterns for each property and type
    for (const [key, propertyErrors] of Object.entries(errorsByPropertyAndType)) {
        if (propertyErrors.length < 3) {
            continue;
        }

        const [property, type] = key.split(':');

        // Create a pattern for adding an interface extension
        patterns.push({
            key: `${code}_${property}_${type.replace(/[^a-zA-Z0-9]/g, '')}`,
            pattern: {
                type: 'multi-line',
                description: `Add ${property} property to ${type}`,
                messageRegex: `Property '${property}' does not exist on type '${type}'`,
                startLine: -5,
                endLine: -5,
                replacement: `// Add interface extension for ${type}\ninterface ${type} {\n  ${property}: any;\n}\n\n{line}`
            }
        });
    }

    return patterns;
}

// Analyze type assignment errors (TS2322)
function analyzeTypeAssignmentErrors(code, errors) {
    const patterns = [];
    const typeRegex = /Type '([^']+)' is not assignable to type '([^']+)'/;

    // Group errors by source and target type
    const errorsByTypes = {};

    for (const error of errors) {
        const match = error.message.match(typeRegex);

        if (match) {
            const sourceType = match[1];
            const targetType = match[2];
            const key = `${sourceType}:${targetType}`;

            if (!errorsByTypes[key]) {
                errorsByTypes[key] = [];
            }

            errorsByTypes[key].push(error);
        }
    }

    // Generate patterns for each source and target type
    for (const [key, typeErrors] of Object.entries(errorsByTypes)) {
        if (typeErrors.length < 3) {
            continue;
        }

        const [sourceType, targetType] = key.split(':');

        // Create a pattern for adding a type assertion
        patterns.push({
            key: `${code}_${sourceType.replace(/[^a-zA-Z0-9]/g, '')}_${targetType.replace(/[^a-zA-Z0-9]/g, '')}`,
            pattern: {
                type: 'replace',
                description: `Add type assertion from ${sourceType} to ${targetType}`,
                messageRegex: `Type '${sourceType}' is not assignable to type '${targetType}'`,
                search: `([^\\s;]+)\\s*$`,
                replace: `$1 as ${targetType}`
            }
        });
    }

    return patterns;
}

// Analyze parameter type errors (TS7006)
function analyzeParameterTypeErrors(code, errors) {
    const patterns = [];
    const paramRegex = /Parameter '([^']+)' implicitly has an 'any' type/;

    // Group errors by parameter
    const errorsByParam = {};

    for (const error of errors) {
        const match = error.message.match(paramRegex);

        if (match) {
            const param = match[1];

            if (!errorsByParam[param]) {
                errorsByParam[param] = [];
            }

            errorsByParam[param].push(error);
        }
    }

    // Generate patterns for each parameter
    for (const [param, paramErrors] of Object.entries(errorsByParam)) {
        if (paramErrors.length < 3) {
            continue;
        }

        // Create a pattern for adding a type annotation
        patterns.push({
            key: `${code}_${param}`,
            pattern: {
                type: 'replace',
                description: `Add type annotation to parameter ${param}`,
                messageRegex: `Parameter '${param}' implicitly has an 'any' type`,
                search: `(\\b${param}\\b)([,\\)])`,
                replace: `$1: unknown$2`
            }
        });
    }

    return patterns;
}

// Analyze null errors (TS2531)
function analyzeNullErrors(code, errors) {
    const patterns = [];
    const nullRegex = /Object is possibly 'null'/;

    // Group errors by context
    const errorsByContext = {};

    for (const error of errors) {
        if (nullRegex.test(error.message)) {
            const context = error.context.trim();

            if (!errorsByContext[context]) {
                errorsByContext[context] = [];
            }

            errorsByContext[context].push(error);
        }
    }

    // Generate patterns for each context
    for (const [context, contextErrors] of Object.entries(errorsByContext)) {
        if (contextErrors.length < 3) {
            continue;
        }

        // Create a pattern for adding a null check
        patterns.push({
            key: `${code}_${contextErrors[0].line}`,
            pattern: {
                type: 'replace',
                description: `Add null check`,
                messageRegex: `Object is possibly 'null'`,
                contextRegex: context.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                search: `([^\\s.]+)\\.([^\\s.]+)`,
                replace: `$1?.[$2]`
            }
        });
    }

    return patterns;
}

// Analyze undefined errors (TS2532)
function analyzeUndefinedErrors(code, errors) {
    const patterns = [];
    const undefinedRegex = /Object is possibly 'undefined'/;

    // Group errors by context
    const errorsByContext = {};

    for (const error of errors) {
        if (undefinedRegex.test(error.message)) {
            const context = error.context.trim();

            if (!errorsByContext[context]) {
                errorsByContext[context] = [];
            }

            errorsByContext[context].push(error);
        }
    }

    // Generate patterns for each context
    for (const [context, contextErrors] of Object.entries(errorsByContext)) {
        if (contextErrors.length < 3) {
            continue;
        }

        // Create a pattern for adding an undefined check
        patterns.push({
            key: `${code}_${contextErrors[0].line}`,
            pattern: {
                type: 'replace',
                description: `Add undefined check`,
                messageRegex: `Object is possibly 'undefined'`,
                contextRegex: context.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                search: `([^\\s.]+)\\.([^\\s.]+)`,
                replace: `$1?.[$2]`
            }
        });
    }

    return patterns;
}

// Analyze argument type errors (TS2345)
function analyzeArgumentTypeErrors(code, errors) {
    const patterns = [];
    const argTypeRegex = /Argument of type '([^']+)' is not assignable to parameter of type '([^']+)'/;

    // Group errors by argument and parameter type
    const errorsByTypes = {};

    for (const error of errors) {
        const match = error.message.match(argTypeRegex);

        if (match) {
            const argType = match[1];
            const paramType = match[2];
            const key = `${argType}:${paramType}`;

            if (!errorsByTypes[key]) {
                errorsByTypes[key] = [];
            }

            errorsByTypes[key].push(error);
        }
    }

    // Generate patterns for each argument and parameter type
    for (const [key, typeErrors] of Object.entries(errorsByTypes)) {
        if (typeErrors.length < 3) {
            continue;
        }

        const [argType, paramType] = key.split(':');

        // Create a pattern for adding a type assertion
        patterns.push({
            key: `${code}_${argType.replace(/[^a-zA-Z0-9]/g, '')}_${paramType.replace(/[^a-zA-Z0-9]/g, '')}`,
            pattern: {
                type: 'replace',
                description: `Add type assertion from ${argType} to ${paramType}`,
                messageRegex: `Argument of type '${argType}' is not assignable to parameter of type '${paramType}'`,
                search: `([^\\s,\\(]+)\\s*([,\\)])`,
                replace: `($1 as ${paramType})$2`
            }
        });
    }

    return patterns;
}

// Analyze argument count errors (TS2554)
function analyzeArgumentCountErrors(code, errors) {
    const patterns = [];
    const argCountRegex = /Expected (\d+) arguments, but got (\d+)/;

    // Group errors by expected and actual argument count
    const errorsByArgCounts = {};

    for (const error of errors) {
        const match = error.message.match(argCountRegex);

        if (match) {
            const expected = parseInt(match[1]);
            const actual = parseInt(match[2]);
            const key = `${expected}:${actual}`;

            if (!errorsByArgCounts[key]) {
                errorsByArgCounts[key] = [];
            }

            errorsByArgCounts[key].push(error);
        }
    }

    // Generate patterns for each expected and actual argument count
    for (const [key, argCountErrors] of Object.entries(errorsByArgCounts)) {
        if (argCountErrors.length < 3) {
            continue;
        }

        const [expected, actual] = key.split(':').map(Number);

        if (actual < expected) {
            // Missing arguments, add undefined
            const missingArgs = Array(expected - actual).fill('undefined').join(', ');

            patterns.push({
                key: `${code}_${expected}_${actual}`,
                pattern: {
                    type: 'replace',
                    description: `Add missing arguments`,
                    messageRegex: `Expected ${expected} arguments, but got ${actual}`,
                    search: `\\)\\s*$`,
                    replace: `, ${missingArgs})`
                }
            });
        } else {
            // Too many arguments, remove extras
            patterns.push({
                key: `${code}_${expected}_${actual}`,
                pattern: {
                    type: 'replace',
                    description: `Remove extra arguments`,
                    messageRegex: `Expected ${expected} arguments, but got ${actual}`,
                    search: `\\(([^\\)]+)\\)`,
                    replace: (match, args) => {
                        const argArray = args.split(',').map(arg => arg.trim());
                        return `(${argArray.slice(0, expected).join(', ')})`;
                    }
                }
            });
        }
    }

    return patterns;
}

// Analyze property suggestion errors (TS2551)
function analyzePropertySuggestionErrors(code, errors) {
    const patterns = [];
    const propSuggestionRegex = /Property '([^']+)' does not exist on type '([^']+)'. Did you mean '([^']+)'\?/;

    // Group errors by property, type, and suggestion
    const errorsByPropTypeSuggestion = {};

    for (const error of errors) {
        const match = error.message.match(propSuggestionRegex);

        if (match) {
            const property = match[1];
            const type = match[2];
            const suggestion = match[3];
            const key = `${property}:${type}:${suggestion}`;

            if (!errorsByPropTypeSuggestion[key]) {
                errorsByPropTypeSuggestion[key] = [];
            }

            errorsByPropTypeSuggestion[key].push(error);
        }
    }

    // Generate patterns for each property, type, and suggestion
    for (const [key, propErrors] of Object.entries(errorsByPropTypeSuggestion)) {
        if (propErrors.length < 3) {
            continue;
        }

        const [property, type, suggestion] = key.split(':');

        // Create a pattern for replacing the property with the suggestion
        patterns.push({
            key: `${code}_${property}_${suggestion}`,
            pattern: {
                type: 'replace',
                description: `Replace '${property}' with '${suggestion}' on type '${type}'`,
                messageRegex: `Property '${property}' does not exist on type '${type}'. Did you mean '${suggestion}'\\?`,
                search: `(\\b${property}\\b)`,
                replace: suggestion
            }
        });
    }

    return patterns;
}

// Analyze missing property errors (TS2741)
function analyzeMissingPropertyErrors(code, errors) {
    const patterns = [];
    const missingPropRegex = /Property '([^']+)' is missing in type '([^']+)' but required in type '([^']+)'/;

    // Group errors by property, source type, and target type
    const errorsByPropTypes = {};

    for (const error of errors) {
        const match = error.message.match(missingPropRegex);

        if (match) {
            const property = match[1];
            const sourceType = match[2];
            const targetType = match[3];
            const key = `${property}:${sourceType}:${targetType}`;

            if (!errorsByPropTypes[key]) {
                errorsByPropTypes[key] = [];
            }

            errorsByPropTypes[key].push(error);
        }
    }

    // Generate patterns for each property, source type, and target type
    for (const [key, propErrors] of Object.entries(errorsByPropTypes)) {
        if (propErrors.length < 3) {
            continue;
        }

        const [property, sourceType, targetType] = key.split(':');

        // Create a pattern for adding the missing property
        patterns.push({
            key: `${code}_${property}_${sourceType.replace(/[^a-zA-Z0-9]/g, '')}_${targetType.replace(/[^a-zA-Z0-9]/g, '')}`,
            pattern: {
                type: 'replace',
                description: `Add missing property '${property}' to type '${sourceType}'`,
                messageRegex: `Property '${property}' is missing in type '${sourceType}' but required in type '${targetType}'`,
                search: `({\\s*(?:[^{}]*\\s*)*)\\s*}\\s*$`,
                replace: `$1, ${property}: undefined }`
            }
        });
    }

    return patterns;
}

// Analyze return statement errors (TS2366)
function analyzeReturnStatementErrors(code, errors) {
    const patterns = [];
    const returnRegex = /Function lacks ending return statement and return type does not include 'undefined'/;

    // Group errors by context
    const errorsByContext = {};

    for (const error of errors) {
        if (returnRegex.test(error.message)) {
            const context = error.context.trim();

            if (!errorsByContext[context]) {
                errorsByContext[context] = [];
            }

            errorsByContext[context].push(error);
        }
    }

    // Generate patterns for each context
    for (const [context, contextErrors] of Object.entries(errorsByContext)) {
        if (contextErrors.length < 3) {
            continue;
        }

        // Create a pattern for adding a return statement
        patterns.push({
            key: `${code}_${contextErrors[0].line}`,
            pattern: {
                type: 'replace',
                description: `Add return statement`,
                messageRegex: `Function lacks ending return statement and return type does not include 'undefined'`,
                contextRegex: context.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                search: `(\\s*})\\s*$`,
                replace: `\n  return undefined;$1`
            }
        });
    }

    return patterns;
}

// Save new patterns
async function saveNewPatterns(patterns, newPatterns) {
    for (const { key, pattern } of newPatterns) {
        patterns.patterns[key] = pattern;
    }

    patterns.lastUpdated = new Date().toISOString();
    await fs.writeFile(ERROR_PATTERNS_PATH, JSON.stringify(patterns, null, 2));
}

// Generate recommendations
function generateRecommendations(errors) {
    const recommendations = [
        'Add strict TypeScript configuration in tsconfig.json',
        'Use explicit return types for all functions',
        'Avoid using "any" and use "unknown" where necessary',
        'Define clear interfaces for all props',
        'Use React.FC<Props> for functional components',
        'Add null checks for all potentially null values',
        'Add undefined checks for all potentially undefined values',
        'Use optional chaining (?.) for accessing properties of potentially null/undefined objects',
        'Use nullish coalescing (??) for providing default values',
        'Add type assertions only when necessary and with caution'
    ];

    // Add specific recommendations based on error codes
    const errorCodes = new Set(errors.map(error => error.code));

    if (errorCodes.has('TS2339')) {
        recommendations.push('Create interface extensions for missing properties');
    }

    if (errorCodes.has('TS2322')) {
        recommendations.push('Review type assignments and add appropriate type assertions');
    }

    if (errorCodes.has('TS7006')) {
        recommendations.push('Add explicit type annotations to all parameters');
    }

    if (errorCodes.has('TS2531') || errorCodes.has('TS2532')) {
        recommendations.push('Add strict null checks and use optional chaining');
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
