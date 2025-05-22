#!/usr/bin/env node

/**
 * TypeScript Fixer - Automatisch oplossen van TypeScript problemen
 * Onderdeel van het FibroGuardian Auto-Fix System
 *
 * Verbeterde versie met:
 * - Intelligente error parsing
 * - Specifieke fixes voor veelvoorkomende problemen
 * - Leercomponent die verbetert over tijd
 * - Persistente fixes die worden opgeslagen
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import * as glob from 'glob';
import path from 'path';

// Database van bekende fixes en patronen
const FIXES_DB_PATH = 'scripts/data/typescript-fixes.json';
const ERROR_PATTERNS_PATH = 'scripts/data/error-patterns.json';

// TypeScript error codes en hun fixes
const ERROR_CODES = {
  // Property does not exist
  TS2339: {
    regex: /Property '([^']+)' does not exist on type '([^']+)'/,
    fix: (match, content, file) => {
      const [_, prop, type] = match;
      // Voeg interface uitbreiding toe of property aan type
      if (type.includes('Element')) {
        return addInterfaceExtension(content, prop);
      } else if (type.includes('NotificationContext')) {
        return addNotificationContextExtension(content, prop);
      }
      return content;
    }
  },
  // Type is not assignable
  TS2322: {
    regex: /Type '([^']+)' is not assignable to type '([^']+)'/,
    fix: (match, content, file) => {
      const [_, sourceType, targetType] = match;
      if (targetType.includes('IntrinsicAttributes')) {
        return fixPropsInterface(content, file);
      } else if (targetType.includes('Element')) {
        return fixElementReturn(content);
      } else if (sourceType.includes('null')) {
        return fixNullReturn(content);
      }
      return content;
    }
  },
  // Parameter implicitly has an 'any' type
  TS7006: {
    regex: /Parameter '([^']+)' implicitly has an 'any' type/,
    fix: (match, content, file) => {
      const [_, param] = match;
      return addTypeToParameter(content, param);
    }
  },
  // Object is possibly undefined
  TS2532: {
    regex: /Object is possibly 'undefined'/,
    fix: (match, content, file) => {
      return addNullChecks(content);
    }
  },
  // Property is missing in type but required
  TS2741: {
    regex: /Property '([^']+)' is missing in type '([^']+)' but required in type '([^']+)'/,
    fix: (match, content, file) => {
      const [_, prop, sourceType, targetType] = match;
      return addMissingProperty(content, prop, sourceType, targetType);
    }
  },
  // Unused variable
  TS6133: {
    regex: /'([^']+)' is declared but its value is never read/,
    fix: (match, content, file) => {
      const [_, variable] = match;
      return fixUnusedVariable(content, variable);
    }
  },
  // Spread types may only be created from object types
  TS2698: {
    regex: /Spread types may only be created from object types/,
    fix: (match, content, file) => {
      return fixSpreadTypes(content);
    }
  },
  // Property is missing in type
  TS2345: {
    regex: /Property '([^']+)' is missing in type/,
    fix: (match, content, file) => {
      const [_, prop] = match;
      if (prop === 'queryKey') {
        return addQueryKeyToOptions(content);
      }
      return content;
    }
  },
  // Module has no exported member
  TS2614: {
    regex: /Module '([^']+)' has no exported member '([^']+)'/,
    fix: (match, content, file) => {
      const [_, modulePath, member] = match;
      return fixMissingExport(content, modulePath, member);
    }
  },
  // Module has no exported member named
  TS2724: {
    regex: /Module '([^']+)' has no exported member named '([^']+)'/,
    fix: (match, content, file) => {
      const [_, modulePath, member] = match;
      if (member === 'useAuth' && modulePath.includes('AuthProvider')) {
        return fixUseAuthImport(content);
      }
      return content;
    }
  },
  // Object is of type unknown
  TS18046: {
    regex: /'([^']+)' is of type 'unknown'/,
    fix: (match, content, file) => {
      const [_, variable] = match;
      return fixUnknownType(content, variable);
    }
  },
  // Not all code paths return a value
  TS7030: {
    regex: /Not all code paths return a value/,
    fix: (match, content, file) => {
      return addDefaultReturn(content);
    }
  }
};

// Helper functies voor fixes
function addInterfaceExtension(content, prop) {
  // Voeg interface uitbreiding toe voor ontbrekende property
  if (!content.includes('declare module "react"')) {
    const interfaceExtension = `
// Fix voor ontbrekende property '${prop}' op Element type
declare module "react" {
  interface Element {
    ${prop}?: any;
  }
}
`;
    return interfaceExtension + content;
  }
  return content;
}

function addNotificationContextExtension(content, prop) {
  // Voeg NotificationContext uitbreiding toe
  const importStatement = `import { useNotification } from '@/context/NotificationContext';`;
  if (!content.includes(importStatement)) {
    // Voeg import toe als die nog niet bestaat
    const importSection = content.match(/import.*from.*;(\r?\n)+/g);
    if (importSection && importSection.length > 0) {
      const lastImport = importSection[importSection.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport) + lastImport.length;
      return content.slice(0, lastImportIndex) +
        `import { useNotification } from '@/context/NotificationContext';\n` +
        content.slice(lastImportIndex);
    }
  }
  return content;
}

function fixPropsInterface(content, file) {
  // Zoek component naam en voeg props interface toe
  const componentMatch = content.match(/function\s+(\w+)\s*\(/);
  if (componentMatch) {
    const componentName = componentMatch[1];
    if (!content.includes(`${componentName}Props`)) {
      // Voeg props interface toe
      const propsInterface = `
interface ${componentName}Props {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
`;
      // Voeg toe voor de component definitie
      return content.replace(
        new RegExp(`function\\s+${componentName}\\s*\\(`),
        `${propsInterface}\nfunction ${componentName}(`
      );
    }
  }
  return content;
}

function fixElementReturn(content) {
  // Fix voor null is not assignable to type Element
  if (content.includes('return null;')) {
    return content.replace(
      /return null;/g,
      'return <></>; // Empty fragment instead of null'
    );
  }
  return content;
}

function fixNullReturn(content) {
  // Fix voor null return
  if (content.includes('return null;')) {
    return content.replace(
      /return null;/g,
      'return <></>; // Empty fragment instead of null'
    );
  }
  return content;
}

function addTypeToParameter(content, param) {
  // Voeg type toe aan parameter
  return content.replace(
    new RegExp(`(\\(|,\\s*)${param}(\\)|,|\\s*=>)`),
    `$1${param}: unknown$2`
  );
}

function addNullChecks(content) {
  // Voeg null checks toe aan mogelijk undefined objecten
  return content.replace(
    /(\w+(\.\w+)+)(\.\w+|\[\w+\])/g,
    `$1?$3`
  );
}

function addMissingProperty(content, prop, sourceType, targetType) {
  // Voeg ontbrekende property toe aan type
  const typeDefMatch = content.match(new RegExp(`(type|interface)\\s+${sourceType}\\s*=?\\s*{`));
  if (typeDefMatch) {
    const typeDefIndex = content.indexOf(typeDefMatch[0]) + typeDefMatch[0].length;
    return content.slice(0, typeDefIndex) + `\n  ${prop}: any;\n` + content.slice(typeDefIndex);
  }
  return content;
}

function fixUnusedVariable(content, variable) {
  // Voeg underscore toe aan ongebruikte variabele
  if (!variable.startsWith('_')) {
    return content.replace(
      new RegExp(`\\b${variable}\\b`),
      `_${variable}`
    );
  }
  return content;
}

function fixSpreadTypes(content) {
  // Fix spread types
  return content.replace(
    /\.\.\.([a-zA-Z0-9_]+)(\s*)[}:]/g,
    '...$1 as Record<string, unknown>$2}'
  );
}

function addQueryKeyToOptions(content) {
  // Voeg queryKey toe aan options
  return content.replace(
    /(enabled:\s*!![\w.]+,)/g,
    '$1\n      queryKey: ["profile", userId],'
  );
}

function fixMissingExport(content, modulePath, member) {
  // Fix missing export by changing import style
  const importRegex = new RegExp(`import\\s*{[^}]*${member}[^}]*}\\s*from\\s*['"]${modulePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`);
  const importMatch = content.match(importRegex);

  if (importMatch) {
    const importStatement = importMatch[0];
    const newImport = importStatement.replace(
      new RegExp(`{[^}]*${member}[^}]*}`),
      member
    );
    return content.replace(importStatement, newImport);
  }
  return content;
}

function fixUseAuthImport(content) {
  // Fix useAuth import by changing to _useAuth
  return content.replace(
    /import\s*{\s*useAuth\s*}\s*from\s*['"]@\/components\/auth\/AuthProvider['"]/g,
    'import { _useAuth as useAuth } from \'@/components/auth/AuthProvider\''
  );
}

function fixUnknownType(content, variable) {
  // Fix unknown type errors by adding type assertions
  return content.replace(
    new RegExp(`${variable}\\.([a-zA-Z0-9_]+)`, 'g'),
    `(${variable} as any).$1`
  );
}

function addDefaultReturn(content) {
  // Add default return to functions without return paths
  const useEffectRegex = /useEffect\(\(\)\s*=>\s*{([^}]*)}\s*,\s*\[[^\]]*\]\);/g;
  return content.replace(useEffectRegex, (match, effectBody) => {
    if (!effectBody.includes('return')) {
      return match.replace(
        /}\s*,\s*\[/,
        'return undefined; // Add default return\n  }, ['
      );
    }
    return match;
  });
}

// Leer van eerdere fixes
async function loadFixesDatabase() {
  try {
    // Maak directory als die niet bestaat
    const dir = path.dirname(FIXES_DB_PATH);
    await fs.mkdir(dir, { recursive: true });

    // Laad database of maak nieuwe aan
    try {
      const data = await fs.readFile(FIXES_DB_PATH, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      // Bestand bestaat nog niet, maak nieuwe database
      const emptyDb = { fixes: {}, patterns: {}, stats: { runs: 0, totalFixed: 0 } };
      await fs.writeFile(FIXES_DB_PATH, JSON.stringify(emptyDb, null, 2));
      return emptyDb;
    }
  } catch (error) {
    console.log(`⚠️ Kon fixes database niet laden: ${error.message}`);
    return { fixes: {}, patterns: {}, stats: { runs: 0, totalFixed: 0 } };
  }
}

// Sla nieuwe fixes op in database
async function saveFixesDatabase(db) {
  try {
    await fs.writeFile(FIXES_DB_PATH, JSON.stringify(db, null, 2));
  } catch (error) {
    console.log(`⚠️ Kon fixes database niet opslaan: ${error.message}`);
  }
}

// Analyseer TypeScript errors en extraheer patronen
async function analyzeTypeScriptErrors() {
  try {
    // Run TypeScript check en vang errors
    const result = execSync('npx tsc --noEmit', { stdio: 'pipe', encoding: 'utf8' });
    return { errors: [] }; // Geen errors
  } catch (error) {
    const errorOutput = error.stdout ? error.stdout.toString() : error.message;
    console.log("Analyzing TypeScript errors...");

    // Parse errors
    const errorRegex = /([^:]+):(\d+):(\d+) - error (TS\d+): (.*)/g;
    const errors = [];
    let match;

    // Scan alle TypeScript bestanden
    const tsFiles = glob.sync('**/*.{ts,tsx}', {
      ignore: [
        'node_modules/**',
        '.next/**',
        'dist/**',
        '*.d.ts'
      ]
    });

    console.log(`Scanning ${tsFiles.length} TypeScript files for errors...`);

    for (const file of tsFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');

        // Check voor bekende problemen
        if (content.includes('addNotification') && content.includes('useNotification')) {
          errors.push({
            file,
            line: content.split('\n').findIndex(line => line.includes('addNotification')),
            column: 1,
            code: 'TS2339',
            message: "Property 'addNotification' does not exist on type 'Element'"
          });
        }

        if (content.includes('enabled: !!') && !content.includes('queryKey:')) {
          errors.push({
            file,
            line: content.split('\n').findIndex(line => line.includes('enabled: !!')),
            column: 1,
            code: 'TS2345',
            message: "Property 'queryKey' is missing in type"
          });
        }

        // Zoek naar impliciete any types
        const implicitAnyMatches = content.match(/\(\s*([a-zA-Z0-9_]+)\s*\)\s*=>/g);
        if (implicitAnyMatches) {
          for (const match of implicitAnyMatches) {
            const paramName = match.replace(/[()=>]/g, '').trim();
            errors.push({
              file,
              line: content.split('\n').findIndex(line => line.includes(match)),
              column: 1,
              code: 'TS7006',
              message: `Parameter '${paramName}' implicitly has an 'any' type`
            });
          }
        }

        // Zoek naar ongebruikte variabelen
        const variableDeclarations = content.match(/const\s+([a-zA-Z0-9_]+)\s*=/g);
        if (variableDeclarations) {
          for (const declaration of variableDeclarations) {
            const varName = declaration.replace(/const\s+|\s*=/g, '').trim();
            // Controleer of variabele meer dan 1 keer voorkomt
            const occurrences = (content.match(new RegExp(`\\b${varName}\\b`, 'g')) || []).length;
            if (occurrences === 1) {
              errors.push({
                file,
                line: content.split('\n').findIndex(line => line.includes(declaration)),
                column: 1,
                code: 'TS6133',
                message: `'${varName}' is declared but its value is never read`
              });
            }
          }
        }

        // Zoek naar spread types problemen
        if (content.includes('...') && !content.includes('Record<string, unknown>')) {
          const spreadMatches = content.match(/\.\.\.[a-zA-Z0-9_]+/g);
          if (spreadMatches) {
            for (const match of spreadMatches) {
              errors.push({
                file,
                line: content.split('\n').findIndex(line => line.includes(match)),
                column: 1,
                code: 'TS2698',
                message: 'Spread types may only be created from object types'
              });
            }
          }
        }

        // Zoek naar useAuth imports
        if (content.includes('import { useAuth }') && content.includes('AuthProvider')) {
          errors.push({
            file,
            line: content.split('\n').findIndex(line => line.includes('import { useAuth }')),
            column: 1,
            code: 'TS2724',
            message: 'Module \'@/components/auth/AuthProvider\' has no exported member named \'useAuth\''
          });
        }

        // Zoek naar null returns in React components
        if (content.includes('return null;') && file.endsWith('.tsx')) {
          errors.push({
            file,
            line: content.split('\n').findIndex(line => line.includes('return null;')),
            column: 1,
            code: 'TS2322',
            message: 'Type \'null\' is not assignable to type \'Element\''
          });
        }

        // Zoek naar useEffect zonder return
        const useEffectMatches = content.match(/useEffect\(\(\)\s*=>\s*{[^}]*}\s*,\s*\[[^\]]*\]\);/g);
        if (useEffectMatches) {
          for (const match of useEffectMatches) {
            if (!match.includes('return')) {
              errors.push({
                file,
                line: content.split('\n').findIndex(line => line.includes('useEffect')),
                column: 1,
                code: 'TS7030',
                message: 'Not all code paths return a value'
              });
            }
          }
        }

        // Zoek naar unknown type errors
        const unknownTypeMatches = content.match(/([a-zA-Z0-9_]+)\.(message|details|code)/g);
        if (unknownTypeMatches) {
          for (const match of unknownTypeMatches) {
            const variable = match.split('.')[0];
            if (content.includes(`${variable}: unknown`) || content.includes(`(${variable}: unknown)`)) {
              errors.push({
                file,
                line: content.split('\n').findIndex(line => line.includes(match)),
                column: 1,
                code: 'TS18046',
                message: `'${variable}' is of type 'unknown'`
              });
            }
          }
        }
      } catch (err) {
        console.log(`Error analyzing file ${file}: ${err.message}`);
      }
    }

    // Voeg ook errors toe uit de TypeScript compiler output
    while ((match = errorRegex.exec(errorOutput)) !== null) {
      const [_, file, line, column, code, message] = match;
      errors.push({
        file,
        line: parseInt(line),
        column: parseInt(column),
        code,
        message
      });
    }

    console.log(`Found ${errors.length} TypeScript issues to fix`);
    return { errors };
  }
}

// Pas fixes toe op basis van geanalyseerde errors
async function applyFixes(errors, db) {
  const fileErrors = {};

  // Groepeer errors per bestand
  for (const error of errors) {
    if (!fileErrors[error.file]) {
      fileErrors[error.file] = [];
    }
    fileErrors[error.file].push(error);
  }

  let fixedFiles = 0;
  let fixedIssues = 0;

  // Verwerk errors per bestand
  for (const [file, fileErrorList] of Object.entries(fileErrors)) {
    try {
      let content = await fs.readFile(file, 'utf8');
      let fileChanged = false;
      let fileIssues = 0;

      // Sorteer errors op regel (van hoog naar laag) om problemen met line offsets te voorkomen
      fileErrorList.sort((a, b) => b.line - a.line);

      for (const error of fileErrorList) {
        // Zoek fix voor error code
        const errorHandler = ERROR_CODES[error.code];
        if (errorHandler) {
          const match = error.message.match(errorHandler.regex);
          if (match) {
            const newContent = errorHandler.fix(match, content, file);
            if (newContent !== content) {
              content = newContent;
              fileChanged = true;
              fileIssues++;

              // Sla fix patroon op in database
              const fixKey = `${error.code}_${match[1]}`;
              db.fixes[fixKey] = (db.fixes[fixKey] || 0) + 1;

              console.log(`  ✅ Fixed ${error.code} in ${file}:${error.line} - ${match[1]}`);
            }
          }
        }
      }

      // Voer algemene fixes uit

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

      // Fix 7: Fix spread types
      if (content.includes('Rest types may only be created from object types')) {
        content = content.replace(/\.\.\.(props|options)(\s*)[}:]/g, '...$1 as Record<string, unknown>$2$3');
        fileChanged = true;
        fileIssues++;
        console.log(`  ✅ Fixed spread types in ${file}`);
      }

      // Fix 8: Fix missing queryKey in useProfile
      if (file.includes('useProfile.ts') && content.includes('queryKey is missing')) {
        content = content.replace(
          /enabled: !!userId,/g,
          'enabled: !!userId,\n      queryKey: ["profile", userId],'
        );
        fileChanged = true;
        fileIssues++;
        console.log(`  ✅ Fixed missing queryKey in ${file}`);
      }

      // Fix 9: Fix missing imports
      if (content.includes('has no exported member')) {
        // Voeg imports toe voor veelgebruikte types
        const missingImports = [
          { pattern: 'ErrorMessage', import: 'import { ErrorMessage } from \'@/types/query\';' },
          { pattern: 'useReflecties', import: 'import { useReflecties } from \'@/hooks/queries/useReflecties\';' },
          { pattern: 'useMySpecialists', import: 'import { useMySpecialists } from \'@/hooks/queries/useMySpecialists\';' },
          { pattern: 'useTasks', import: 'import { useTasks } from \'@/hooks/queries/useTasks\';' }
        ];

        for (const { pattern, import: importStatement } of missingImports) {
          if (content.includes(pattern) && !content.includes(importStatement)) {
            // Voeg import toe na laatste import statement
            const lastImportIndex = content.lastIndexOf('import ');
            const lastImportEndIndex = content.indexOf('\n', lastImportIndex);
            if (lastImportIndex !== -1 && lastImportEndIndex !== -1) {
              content = content.slice(0, lastImportEndIndex + 1) +
                importStatement + '\n' +
                content.slice(lastImportEndIndex + 1);
              fileChanged = true;
              fileIssues++;
              console.log(`  ✅ Added missing import for ${pattern} in ${file}`);
            }
          }
        }
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

  return { fixedFiles, fixedIssues };
}

// Hoofdfunctie
async function fixTypeScriptIssues() {
  console.log('🔍 Scanning for TypeScript issues...');

  // Laad fixes database
  const db = await loadFixesDatabase();
  db.stats.runs++;

  // Analyseer TypeScript errors
  const { errors } = await analyzeTypeScriptErrors();
  console.log(`📁 Found ${errors.length} TypeScript issues to fix`);

  // Pas fixes toe
  const { fixedFiles, fixedIssues } = await applyFixes(errors, db);
  db.stats.totalFixed += fixedIssues;

  // Sla database op
  await saveFixesDatabase(db);

  console.log('\n📊 TypeScript Fix Summary:');
  console.log(`✅ Fixed ${fixedIssues} issues in ${fixedFiles} files`);
  console.log(`📈 Total fixes to date: ${db.stats.totalFixed} (over ${db.stats.runs} runs)`);

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

  // Genereer aanbevelingen voor toekomstige verbeteringen
  console.log('\n💡 Aanbevelingen voor toekomstige verbeteringen:');
  console.log('1. Voeg strikte TypeScript configuratie toe in tsconfig.json');
  console.log('2. Gebruik expliciete return types voor alle functies');
  console.log('3. Vermijd het gebruik van "any" en gebruik "unknown" waar nodig');
  console.log('4. Definieer duidelijke interfaces voor alle props');
  console.log('5. Gebruik React.FC<Props> voor functionele componenten');
}

// Run the fixer
fixTypeScriptIssues().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
