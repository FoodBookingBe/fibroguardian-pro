/**
 * Start Unified TypeScript Auto-Fix System
 *
 * This script is a simple wrapper to run the unified-auto-fix.js script
 * with the necessary setup for the data directory.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Create typescript-fixes.json if it doesn't exist
const typescriptFixesFile = path.join(dataDir, 'typescript-fixes.json');
if (!fs.existsSync(typescriptFixesFile)) {
    const typescriptFixes = [
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
    fs.writeFileSync(typescriptFixesFile, JSON.stringify(typescriptFixes, null, 2));
}

// Create error-patterns.json if it doesn't exist
const errorPatternsFile = path.join(dataDir, 'error-patterns.json');
if (!fs.existsSync(errorPatternsFile)) {
    const errorPatterns = [
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
    fs.writeFileSync(errorPatternsFile, JSON.stringify(errorPatterns, null, 2));
}

// Run the unified auto-fix script
console.log('Starting Unified TypeScript Auto-Fix System...');
try {
    execSync('node scripts/unified-auto-fix.cjs', { stdio: 'inherit' });
    console.log('Unified TypeScript Auto-Fix System completed successfully.');
} catch (error) {
    console.error('Error running Unified TypeScript Auto-Fix System:', error.message);
    process.exit(1);
}
