#!/usr/bin/env node

/**
 * Fix Type Assertions Script
 *
 * This script automatically fixes incorrect TypeScript type assertions in destructuring patterns.
 * It looks for patterns like `const { id, ...updateData as Record<string, unknown> } = data;`
 * and replaces them with the correct syntax:
 * `const { id, ...updateData } = data; const typedUpdateData = updateData as Record<string, unknown>;`
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import { glob } from 'glob';

// Configuration
const EXTENSIONS = ['.ts', '.tsx'];
const IGNORE_DIRS = ['node_modules', '.next', 'dist', 'build', 'out'];

// Main function
async function main() {
    console.log('🔍 Scanning for incorrect type assertions in destructuring patterns...');

    try {
        // Find all TypeScript files
        const files = await findTypeScriptFiles();
        console.log(`📁 Found ${files.length} TypeScript files to scan`);

        let totalFixed = 0;
        let filesFixed = 0;

        // Process each file
        for (const file of files) {
            const fixedCount = await processFile(file);

            if (fixedCount > 0) {
                filesFixed++;
                totalFixed += fixedCount;
                console.log(`  ✅ Fixed ${fixedCount} issues in ${file}`);
            }
        }

        console.log('\n📊 Type Assertion Fix Summary:');
        console.log(`✅ Fixed ${totalFixed} issues in ${filesFixed} files`);

        // Run TypeScript check to see if there are still issues
        console.log('\n🔍 Checking for remaining TypeScript issues...');
        try {
            execSync('npx tsc --noEmit', { stdio: 'pipe' });
            console.log('✅ No TypeScript errors found!');
        } catch (error) {
            const errorOutput = error.stdout.toString();
            const errorCount = (errorOutput.match(/error TS\d+/g) || []).length;
            console.log(`⚠️ ${errorCount} TypeScript errors still remain`);
            console.log('Run "npx tsc --noEmit" to see detailed errors');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Find all TypeScript files in the project
async function findTypeScriptFiles() {
    const ignorePattern = IGNORE_DIRS.map(dir => `**/${dir}/**`);

    return glob(`**/*{${EXTENSIONS.join(',')}}`, {
        ignore: ignorePattern
    });
}

// Process a single file
async function processFile(filePath) {
    // Read file content
    const content = await fs.readFile(filePath, 'utf8');

    // Define regex patterns for incorrect type assertions in destructuring
    const patterns = [
        // Pattern 1: {...obj as Type}
        {
            regex: /(\.\.\.[a-zA-Z0-9_]+)\s+as\s+([^}]+)}/g,
            replacement: (match, spread, type) => `${spread}} // Type assertion fixed\nconst typed${capitalize(spread.slice(3))} = ${spread.slice(3)} as ${type};`
        },
        // Pattern 2: if (error: unknown)
        {
            regex: /if\s*\(([a-zA-Z0-9_]+):\s*([a-zA-Z0-9_<>,\s]+)\)/g,
            replacement: (match, variable, type) => `if (${variable})`
        },
        // Pattern 3: function(...params as Type)
        {
            regex: /(\.\.\.[a-zA-Z0-9_]+)\s+as\s+([^)]+)\)/g,
            replacement: (match, spread, type) => `${spread})`
        },
        // Pattern 4: .eq('id', id: unknown)
        {
            regex: /\.eq\(\s*['"]([^'"]+)['"]\s*,\s*([a-zA-Z0-9_]+):\s*([a-zA-Z0-9_<>,\s]+)\)/g,
            replacement: (match, field, variable, type) => `.eq('${field}', ${variable})`
        },
        // Pattern 5: .update(data: unknown)
        {
            regex: /\.update\(\s*([a-zA-Z0-9_]+):\s*([a-zA-Z0-9_<>,\s]+)\)/g,
            replacement: (match, variable, type) => `.update(${variable})`
        },
        // Pattern 6: .insert(data: unknown)
        {
            regex: /\.insert\(\s*([a-zA-Z0-9_]+):\s*([a-zA-Z0-9_<>,\s]+)\)/g,
            replacement: (match, variable, type) => `.insert(${variable})`
        },
        // Pattern 7: window.dispatchEvent(event: unknown)
        {
            regex: /([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)\(\s*([a-zA-Z0-9_]+):\s*([a-zA-Z0-9_<>,\s]+)\)/g,
            replacement: (match, method, variable, type) => `${method}(${variable})`
        },
        // Pattern 8: schema.parse(data: unknown)
        {
            regex: /([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)\(\s*([a-zA-Z0-9_]+):\s*([a-zA-Z0-9_<>,\s]+)\)/g,
            replacement: (match, method, variable, type) => `${method}(${variable})`
        },
        // Pattern 9: result.some(e: unknown =>
        {
            regex: /([a-zA-Z0-9_]+)\.some\(\s*([a-zA-Z0-9_]+):\s*([a-zA-Z0-9_<>,\s]+)\s*=>/g,
            replacement: (match, array, variable, type) => `${array}.some(${variable} =>`
        },
        // Pattern 10: super(props: unknown)
        {
            regex: /super\(\s*([a-zA-Z0-9_]+):\s*([a-zA-Z0-9_<>,\s]+)\)/g,
            replacement: (match, variable, type) => `super(${variable})`
        }
    ];

    let newContent = content;
    let fixedCount = 0;

    // Apply each pattern
    for (const pattern of patterns) {
        const matches = [...newContent.matchAll(pattern.regex)];

        if (matches.length > 0) {
            newContent = newContent.replace(pattern.regex, pattern.replacement);
            fixedCount += matches.length;
        }
    }

    // Save file if changes were made
    if (fixedCount > 0) {
        await fs.writeFile(filePath, newContent, 'utf8');
    }

    return fixedCount;
}

// Helper function to capitalize first letter
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Run the script
main().catch(console.error);
