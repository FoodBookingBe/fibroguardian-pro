#!/usr/bin/env node

/**
 * FibroGuardian Auto-Fix System
 * Automatisch oplossen van ESLint/TypeScript problemen
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';


import { ESLint } from 'eslint';

class AutoFixSystem {
  constructor() {
    this.eslint = new ESLint({
      fix: true,
      cache: true,
      cacheLocation: '.eslintcache'
    });
    this.fixedFiles = new Set();
    this.problemsByType = new Map();
    this.autoFixRules = this.initializeAutoFixRules();
  }

  initializeAutoFixRules() {
    return {
      // Import/Export problemen
      'import/order': {
        autofix: true,
        command: 'eslint --fix',
        priority: 1
      },
      'unused-imports/no-unused-imports': {
        autofix: true,
        command: 'eslint --fix',
        priority: 1
      },
      'import/no-named-as-default': {
        autofix: false,
        handler: this.fixNamedAsDefault.bind(this),
        priority: 2
      },

      // TypeScript problemen
      '@typescript-eslint/no-unused-vars': {
        autofix: false,
        handler: this.fixUnusedVars.bind(this),
        priority: 2
      },
      '@typescript-eslint/explicit-module-boundary-types': {
        autofix: false,
        handler: this.addReturnTypes.bind(this),
        priority: 3
      },
      '@typescript-eslint/no-explicit-any': {
        autofix: false,
        handler: this.fixExplicitAny.bind(this),
        priority: 3
      },

      // Tailwind problemen
      'tailwindcss/classnames-order': {
        autofix: true,
        command: 'eslint --fix',
        priority: 1
      },
      'tailwindcss/enforces-shorthand': {
        autofix: true,
        command: 'eslint --fix',
        priority: 1
      },
      'tailwindcss/migration-from-tailwind-2': {
        autofix: false,
        handler: this.fixTailwindMigration.bind(this),
        priority: 2
      },

      // Console en code quality
      'no-console': {
        autofix: false,
        handler: this.fixConsoleStatements.bind(this),
        priority: 2
      },
      'react-hooks/exhaustive-deps': {
        autofix: false,
        handler: this.fixReactHookDeps.bind(this),
        priority: 3
      }
    };
  }

  async analyzeProblems(diagnostics) {
    console.log('🔍 Analyseren van problemen...');

    for (const problem of diagnostics) {
      const ruleId = problem.code?.value || problem.code;
      if (!this.problemsByType.has(ruleId)) {
        this.problemsByType.set(ruleId, []);
      }
      this.problemsByType.get(ruleId).push(problem);
    }

    // Sorteer problemen op prioriteit
    const sortedProblems = Array.from(this.problemsByType.entries())
      .sort(([a], [b]) => {
        const priorityA = this.autoFixRules[a]?.priority || 999;
        const priorityB = this.autoFixRules[b]?.priority || 999;
        return priorityA - priorityB;
      });

    console.log(`📊 Gevonden problemen:`);
    for (const [ruleId, problems] of sortedProblems) {
      console.log(`  - ${ruleId}: ${problems.length} problemen`);
    }

    return sortedProblems;
  }

  async autoFixProblems(sortedProblems) {
    console.log('\n🔧 Starten met automatische fixes...');

    for (const [ruleId, problems] of sortedProblems) {
      const rule = this.autoFixRules[ruleId];

      if (!rule) {
        console.log(`⚠️  Geen regel gevonden voor: ${ruleId}`);
        continue;
      }

      console.log(`\n🎯 Oplossen van ${ruleId} (${problems.length} problemen)`);

      if (rule.autofix && rule.command) {
        await this.runESLintFix(problems);
      } else if (rule.handler) {
        await rule.handler(problems);
      }
    }
  }

  async runESLintFix(problems) {
    const files = [...new Set(problems.map(p => p.resource))];

    for (const file of files) {
      try {
        const relativePath = path.relative(process.cwd(), file);
        console.log(`  ⚡ ESLint fix: ${relativePath}`);

        execSync(`npx eslint "${relativePath}" --fix`, {
          stdio: 'pipe',
          cwd: process.cwd()
        });

        this.fixedFiles.add(file);
      } catch (error) {
        console.log(`  ❌ ESLint fix gefaald voor: ${file}`);
      }
    }
  }

  async fixUnusedVars(problems) {
    for (const problem of problems) {
      try {
        const content = await fs.readFile(problem.resource, 'utf8');
        const lines = content.split('\n');
        const line = lines[problem.startLineNumber - 1];

        // Voeg underscore toe aan ongebruikte variabelen
        const varName = problem.message.match(/'([^']+)'/)?.[1];
        if (varName && !varName.startsWith('_')) {
          const newLine = line.replace(
            new RegExp(`\\b${varName}\\b`),
            `_${varName}`
          );
          lines[problem.startLineNumber - 1] = newLine;

          await fs.writeFile(problem.resource, lines.join('\n'));
          console.log(`  ✅ Ongebruikte var gefix: ${varName} -> _${varName}`);
        }
      } catch (error) {
        console.log(`  ❌ Kon unused var niet fixen: ${error.message}`);
      }
    }
  }

  async addReturnTypes(problems) {
    for (const problem of problems) {
      try {
        const content = await fs.readFile(problem.resource, 'utf8');
        const lines = content.split('\n');
        const line = lines[problem.startLineNumber - 1];

        // Simpele return type toevoeging voor React componenten
        if (line.includes('export') && (line.includes('function') || line.includes('=>'))) {
          if (line.includes('React') || problem.resource.includes('.tsx')) {
            const newLine = line.replace(/(\s*{\s*$)/, ': JSX.Element $1');
            if (newLine !== line) {
              lines[problem.startLineNumber - 1] = newLine;
              await fs.writeFile(problem.resource, lines.join('\n'));
              console.log(`  ✅ Return type toegevoegd voor React component`);
            }
          }
        }
      } catch (error) {
        console.log(`  ❌ Kon return type niet toevoegen: ${error.message}`);
      }
    }
  }

  async fixExplicitAny(problems) {
    const anyReplacements = {
      'any': 'unknown',
      'any[]': 'unknown[]',
      'Array<any>': 'Array<unknown>'
    };

    for (const problem of problems) {
      try {
        const content = await fs.readFile(problem.resource, 'utf8');
        let newContent = content;

        for (const [oldType, newType] of Object.entries(anyReplacements)) {
          newContent = newContent.replace(
            new RegExp(`\\b${oldType}\\b`, 'g'),
            newType
          );
        }

        if (newContent !== content) {
          await fs.writeFile(problem.resource, newContent);
          console.log(`  ✅ Explicit any vervangen met unknown`);
        }
      } catch (error) {
        console.log(`  ❌ Kon explicit any niet fixen: ${error.message}`);
      }
    }
  }

  async fixTailwindMigration(problems) {
    const v2toV3Mapping = {
      'flex-grow': 'grow',
      'flex-shrink': 'shrink',
      'flex-shrink-0': 'shrink-0'
    };

    for (const problem of problems) {
      try {
        const content = await fs.readFile(problem.resource, 'utf8');
        let newContent = content;

        for (const [oldClass, newClass] of Object.entries(v2toV3Mapping)) {
          newContent = newContent.replace(
            new RegExp(`\\b${oldClass}\\b`, 'g'),
            newClass
          );
        }

        if (newContent !== content) {
          await fs.writeFile(problem.resource, newContent);
          console.log(`  ✅ Tailwind v2 naar v3 migratie uitgevoerd`);
        }
      } catch (error) {
        console.log(`  ❌ Kon Tailwind migratie niet uitvoeren: ${error.message}`);
      }
    }
  }

  async fixConsoleStatements(problems) {
    for (const problem of problems) {
      try {
        const content = await fs.readFile(problem.resource, 'utf8');
        const lines = content.split('\n');
        const line = lines[problem.startLineNumber - 1];

        // Vervang console.log met logger waar mogelijk
        if (line.includes('console.log')) {
          const newLine = line.replace('console.log', '// console.log');
          lines[problem.startLineNumber - 1] = newLine;
          await fs.writeFile(problem.resource, lines.join('\n'));
          console.log(`  ✅ Console statement uitgecommentarieerd`);
        }
      } catch (error) {
        console.log(`  ❌ Kon console statement niet fixen: ${error.message}`);
      }
    }
  }

  async fixReactHookDeps(problems) {
    // Deze is complex - voorlopig alleen loggen
    for (const problem of problems) {
      console.log(`  ⚠️  React Hook dependency issue in: ${path.basename(problem.resource)}`);
      console.log(`      ${problem.message}`);
    }
  }

  async fixNamedAsDefault(problems) {
    // Deze vereist handmatige review - voorlopig alleen loggen
    for (const problem of problems) {
      console.log(`  ⚠️  Named import issue in: ${path.basename(problem.resource)}`);
      console.log(`      ${problem.message}`);
    }
  }

  async generateReport() {
    console.log('\n📋 Fix Report:');
    console.log(`✅ Bestanden gefixt: ${this.fixedFiles.size}`);
    console.log(`🔧 Regels toegepast: ${this.problemsByType.size}`);

    // Genereer verbeteringssuggesties
    console.log('\n💡 Aanbevelingen voor verbetering:');
    console.log('1. Configureer Prettier voor consistente formatting');
    console.log('2. Voeg pre-commit hooks toe met lint-staged');
    console.log('3. Configureer VS Code auto-fix on save');
    console.log('4. Implementeer strikte TypeScript configuratie');
  }

  async setupPreventiveSystem() {
    console.log('\n🛡️  Setting up preventive system...');

    // Maak .vscode/settings.json voor auto-fix
    const vscodeSettings = {
      "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true,
        "source.organizeImports": true,
        "source.removeUnusedImports": true
      },
      "editor.formatOnSave": true,
      "typescript.preferences.useAliasesForRenames": false,
      "eslint.workingDirectories": ["."],
      "eslint.validate": ["javascript", "typescript", "javascriptreact", "typescriptreact"],
      "eslint.run": "onType",
      "eslint.autoFixOnSave": true,
      "files.trimTrailingWhitespace": true,
      "files.insertFinalNewline": true,
      "javascript.suggest.autoImports": true
    };

    try {
      await fs.mkdir('.vscode', { recursive: true });
      await fs.writeFile('.vscode/settings.json', JSON.stringify(vscodeSettings, null, 2));
      console.log('✅ VS Code auto-fix instellingen geconfigureerd');
    } catch (error) {
      console.log('❌ Kon VS Code instellingen niet configureren');
    }

    // Maak lint-staged configuratie
    const lintStagedConfig = {
      "*.{js,jsx,ts,tsx}": [
        "eslint --fix",
        "prettier --write"
      ],
      "*.{json,css,md,yml,yaml}": [
        "prettier --write"
      ]
    };

    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      packageJson['lint-staged'] = lintStagedConfig;
      await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
      console.log('✅ Lint-staged configuratie toegevoegd');
    } catch (error) {
      console.log('❌ Kon lint-staged niet configureren');
    }

    // Setup automatische database integratie
    await this.setupDatabaseIntegration();
  }

  async setupDatabaseIntegration() {
    console.log('\n🗄️  Setting up database integration...');

    // Maak cron job voor automatische database schema validatie
    const cronJobScript = `#!/bin/bash
# Automatische database schema validatie en type generatie
cd ${process.cwd()}
npm run db:types
npm run db:validate
npm run fix:types

# Run auto-fix system
node scripts/auto-fix-system.js
node scripts/fix-typescript.js

# Log resultaat
echo "$(date): Automatische database integratie en auto-fix uitgevoerd" >> logs/auto-fix.log
`;

    try {
      await fs.mkdir('scripts/cron', { recursive: true });
      await fs.writeFile('scripts/cron/auto-fix-db.sh', cronJobScript);
      await fs.chmod('scripts/cron/auto-fix-db.sh', '755');
      console.log('✅ Cron job script aangemaakt');

      // Maak logs directory
      await fs.mkdir('logs', { recursive: true });

      // Voeg instructies toe voor het instellen van de cron job
      const cronInstructions = `
# Automatische Database Integratie en Auto-Fix

Om de automatische database integratie en auto-fix in te stellen, voeg de volgende regel toe aan je crontab:

\`\`\`
# Run elke dag om 2:00 AM
0 2 * * * ${process.cwd()}/scripts/cron/auto-fix-db.sh
\`\`\`

Je kunt dit doen door \`crontab -e\` uit te voeren en de bovenstaande regel toe te voegen.

Voor Windows, gebruik Task Scheduler om het script \`scripts/cron/auto-fix-db.sh\` dagelijks uit te voeren.
`;

      await fs.writeFile('docs/CRON_SETUP.md', cronInstructions);
      console.log('✅ Cron job instructies aangemaakt in docs/CRON_SETUP.md');

    } catch (error) {
      console.log(`❌ Kon database integratie niet instellen: ${error.message}`);
    }
  }
}

// Hoofdfunctie
async function main() {
  const autoFixer = new AutoFixSystem();

  try {
    // Lees de diagnostics uit het geüploade bestand of genereer ze
    let diagnostics = [];

    try {
      const diagnosticsContent = await fs.readFile('reports/eslint-diagnostics.json', 'utf8');
      diagnostics = JSON.parse(diagnosticsContent);
    } catch (error) {
      console.log('⚠️ Geen diagnostics bestand gevonden, genereren van ESLint diagnostics...');

      // Run ESLint om diagnostics te genereren
      try {
        execSync('npx eslint . --ext .ts,.tsx,.js,.jsx --format json > reports/eslint-diagnostics.json', {
          stdio: 'pipe'
        });

        const diagnosticsContent = await fs.readFile('reports/eslint-diagnostics.json', 'utf8');
        const eslintResults = JSON.parse(diagnosticsContent);

        // Convert ESLint results to diagnostics format
        for (const result of eslintResults) {
          for (const message of result.messages) {
            diagnostics.push({
              resource: result.filePath,
              code: message.ruleId,
              message: message.message,
              startLineNumber: message.line,
              startColumn: message.column,
              endLineNumber: message.endLine || message.line,
              endColumn: message.endColumn || message.column
            });
          }
        }
      } catch (error) {
        console.log('⚠️ Kon geen ESLint diagnostics genereren:', error.message);
      }
    }

    console.log('🚀 FibroGuardian Auto-Fix System gestart');
    console.log(`📁 Gevonden ${diagnostics.length} problemen`);

    // Analyseer problemen
    const sortedProblems = await autoFixer.analyzeProblems(diagnostics);

    // Fix problemen automatisch
    await autoFixer.autoFixProblems(sortedProblems);

    // Setup preventief systeem
    await autoFixer.setupPreventiveSystem();

    // Genereer rapport
    await autoFixer.generateReport();

    console.log('\n🎉 Auto-fix systeem voltooid!');
    console.log('💡 Run dit script regelmatig of integreer in je CI/CD pipeline');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);

export { AutoFixSystem };

