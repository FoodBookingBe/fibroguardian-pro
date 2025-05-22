#!/usr/bin/env node

/**
 * TypeScript Fixer - Automatisch oplossen van TypeScript problemen
 * Onderdeel van het FibroGuardian Auto-Fix System
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import * as glob from 'glob';

async function fixTypeScriptIssues() {
  console.log('🔍 Scanning for TypeScript issues...');

  // Get all TypeScript files
  const files = glob.sync('**/*.{ts,tsx}', {
    ignore: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      '*.d.ts'
    ]
  });

  console.log(`📁 Found ${files.length} TypeScript files to check`);

  let fixedFiles = 0;
  let fixedIssues = 0;

  for (const file of files) {
    try {
      let content = await fs.readFile(file, 'utf8');
      let fileChanged = false;
      let fileIssues = 0;

      // Fix 1: Add React import for JSX files
      if (file.endsWith('.tsx') && !content.includes('import React') && content.includes('<')) {
        content = `import React from 'react';\n\n${content}`;
        fileChanged = true;
        fileIssues++;
        console.log(`  ✅ Added React import to ${file}`);
      }

      // Fix 2: Add return types for React components
      const componentMatches = content.match(/(export\s+(?:default\s+)?function\s+\w+\s*\([^)]*\))\s*{/g);
      if (componentMatches && file.endsWith('.tsx')) {
        for (const match of componentMatches) {
          if (!match.includes(':')) {
            const newDeclaration = match.replace(/(\)\s*){/, '): JSX.Element {');
            content = content.replace(match, newDeclaration);
            fileChanged = true;
            fileIssues++;
            console.log(`  ✅ Added return type to component in ${file}`);
          }
        }
      }

      // Fix 3: Replace 'any' with 'unknown'
      const anyCount = (content.match(/:\s*any\b/g) || []).length;
      if (anyCount > 0) {
        content = content.replace(/:\s*any\b/g, ': unknown');
        content = content.replace(/Array<any>/g, 'Array<unknown>');
        fileChanged = true;
        fileIssues += anyCount;
        console.log(`  ✅ Replaced ${anyCount} 'any' types with 'unknown' in ${file}`);
      }

      // Fix 4: Add missing imports for common types
      if (content.includes('JSX.Element') && !content.includes('import React')) {
        content = `import React from 'react';\n${content}`;
        fileChanged = true;
        fileIssues++;
        console.log(`  ✅ Added React import for JSX usage in ${file}`);
      }

      // Fix 5: Fix common Promise handling issues
      if (content.includes('Promise<any>')) {
        content = content.replace(/Promise<any>/g, 'Promise<unknown>');
        fileChanged = true;
        fileIssues++;
        console.log(`  ✅ Fixed Promise<any> in ${file}`);
      }

      // Fix 6: Fix event handler types
      if (content.includes('(e: any)') && (content.includes('onClick') || content.includes('onChange'))) {
        content = content.replace(/(onClick|onChange)={\s*\(\s*e\s*:\s*any\s*\)\s*=>/g,
          (match) => {
            if (match.includes('onClick')) {
              return match.replace('e: any', 'e: React.MouseEvent');
            } else {
              return match.replace('e: any', 'e: React.ChangeEvent<HTMLInputElement>');
            }
          });
        fileChanged = true;
        fileIssues++;
        console.log(`  ✅ Fixed event handler types in ${file}`);
      }

      // Save changes if file was modified
      if (fileChanged) {
        await fs.writeFile(file, content);
        fixedFiles++;
        fixedIssues += fileIssues;
      }
    } catch (error) {
      console.log(`  ❌ Error processing ${file}: ${error.message}`);
    }
  }

  console.log('\n📊 TypeScript Fix Summary:');
  console.log(`✅ Fixed ${fixedIssues} issues in ${fixedFiles} files`);

  // Run TypeScript check to see if there are remaining issues
  try {
    console.log('\n🔍 Checking for remaining TypeScript issues...');
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log('✅ No TypeScript errors remaining!');
  } catch (error) {
    const errorOutput = error.stdout.toString();
    const errorCount = (errorOutput.match(/error TS\d+/g) || []).length;
    console.log(`⚠️ ${errorCount} TypeScript errors still remain`);
    console.log('Run "npx tsc --noEmit" to see detailed errors');
  }
}

// Run the fixer
fixTypeScriptIssues().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
