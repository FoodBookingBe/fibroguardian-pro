const fs = require('fs');
const path = require('path');
const glob = require('glob');
// @typescript-eslint/parser is a dev dependency, ensure it's installed
// For simplicity, this script uses regex for JSDoc presence, not full AST parsing for content.
// Full AST parsing for JSDoc content validation is more complex.

// Configuratie
const projectRoot = path.resolve(__dirname, '..');
const dirsToScan = [
  'hooks',
  'utils',
  'lib',
  'components', 
  'containers',
  'context',
  'app', // Scan app directory for pages/layouts if needed
];

// JSDoc template (simplified for detection, actual content varies)
const jsdocBlockRegex = /\/\*\*[\s\S]*?\*\//; // Detects if a JSDoc block exists before an export

// Functie om TSX/TS files te scannen
function scanFiles() {
  const files = [];
  dirsToScan.forEach(dir => {
    const dirPath = path.join(projectRoot, dir);
    if (!fs.existsSync(dirPath)) {
      console.warn(`Directory to scan for JSDoc not found: ${dirPath}`);
      return;
    }
    const pattern = path.join(dirPath, '**/*.{ts,tsx}');
    const dirFiles = glob.sync(pattern, {
      ignore: [
        '**/*.d.ts', 
        '**/*.test.ts', 
        '**/*.test.tsx', 
        '**/*.spec.ts', 
        '**/*.spec.tsx',
        '**/*.stories.tsx',
        '**/node_modules/**',
        '**/.next/**',
        // Exclude specific files if necessary
        path.join(projectRoot, 'lib', 'supabase.ts'), // Often just client exports
        path.join(projectRoot, 'lib', 'react-query-provider.tsx'),
      ],
    });
    files.push(...dirFiles);
  });
  return files;
}

// Functie om JSDoc van een functie, component, of hook te analyseren
function analyzeFileForJSDoc(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');
  
  // Find all exported named functions, consts (arrow functions/components), and classes
  const exportRegex = /export\s+(async\s+)?(function\s+(\w+)|const\s+(\w+)\s*[:=]|class\s+(\w+))/g;
  let match;
  const foundExports = [];
  let lastIndex = 0;

  while ((match = exportRegex.exec(content)) !== null) {
    const exportName = match[3] || match[4] || match[5]; // Function name, const name, or class name
    const exportStartIndex = match.index;
    
    // Look for JSDoc block immediately preceding the export
    const contentBeforeExport = content.substring(lastIndex, exportStartIndex);
    const precedingCommentMatch = jsdocBlockRegex.exec(contentBeforeExport.trimRight());
    const hasJSDoc = !!precedingCommentMatch;

    let type = 'function'; // Default type
    if (exportName.startsWith('use')) {
      type = 'hook';
    } else if (exportName[0] === exportName[0].toUpperCase() && !exportName.endsWith('Provider') && !exportName.endsWith('Context')) {
      // Heuristic: PascalCase and not a Provider/Context is likely a component
      if (filePath.includes('/components/') || filePath.includes('/containers/')) {
        type = 'component';
      }
    } else if (exportName.endsWith('Provider') || exportName.endsWith('Context')) {
      type = 'context';
    } else if (filePath.includes('/utils/') || filePath.includes('/lib/')) {
      type = 'util';
    }
    
    foundExports.push({ name: exportName, type, hasJSDoc });
    lastIndex = exportRegex.lastIndex;
  }
  
  return {
    path: relativePath,
    exports: foundExports,
  };
}

// Genereer rapport
function generateReport(results) {
  let report = '# JSDoc Coverage Report\n\n';
  report += `_Generated on ${new Date().toISOString()}_\n\n`;
  
  const totalExports = results.reduce((sum, file) => sum + file.exports.length, 0);
  const exportsWithJSDoc = results.reduce((sum, file) => 
    sum + file.exports.filter(exp => exp.hasJSDoc).length, 0);
  
  const coveragePercentage = totalExports === 0 ? 0 : 
    ((exportsWithJSDoc / totalExports) * 100).toFixed(1);
  
  report += `## Summary\n\n`;
  report += `- Total exports analyzed: ${totalExports}\n`;
  report += `- Exports with JSDoc: ${exportsWithJSDoc}\n`;
  report += `- Coverage: **${coveragePercentage}%**\n\n`;
  
  const dirStats = {};
  dirsToScan.forEach(dir => {
    dirStats[dir] = { total: 0, withJSDoc: 0, files: [] };
  });

  results.forEach(fileResult => {
    const dirKey = dirsToScan.find(dir => fileResult.path.startsWith(dir + '/'));
    if (dirKey) {
      dirStats[dirKey].total += fileResult.exports.length;
      dirStats[dirKey].withJSDoc += fileResult.exports.filter(exp => exp.hasJSDoc).length;
      if (fileResult.exports.some(exp => !exp.hasJSDoc)) {
        dirStats[dirKey].files.push(fileResult);
      }
    }
  });
  
  report += `## Coverage by Directory\n\n`;
  Object.entries(dirStats).forEach(([dir, stats]) => {
    if (stats.total === 0) return;
    const dirCoveragePercentage = ((stats.withJSDoc / stats.total) * 100).toFixed(1);
    report += `- **${dir}**: ${dirCoveragePercentage}% (${stats.withJSDoc}/${stats.total})\n`;
  });
  
  report += `\n## Files/Exports Missing JSDoc\n\n`;
  let missingCount = 0;
  Object.entries(dirStats).forEach(([dir, stats]) => {
    if (stats.files.length > 0) {
      report += `### Directory: \`${dir}\`\n\n`;
      stats.files.forEach(fileResult => {
        const missingInFile = fileResult.exports.filter(exp => !exp.hasJSDoc);
        if (missingInFile.length > 0) {
          report += `  - **File:** \`${fileResult.path}\`\n`;
          missingInFile.forEach(exp => {
            report += `    - \`${exp.name}\` (type: ${exp.type})\n`;
            missingCount++;
          });
          report += '\n';
        }
      });
    }
  });

  if (missingCount === 0 && totalExports > 0) {
    report += "All found exports appear to have JSDoc comments. Manual verification recommended.\n";
  } else if (totalExports === 0) {
    report += "No exports found to analyze.\n";
  }
  
  return report;
}

// Voer script uit
const filesToScan = scanFiles();
const analysisResults = filesToScan.map(analyzeFileForJSDoc);
const reportContent = generateReport(analysisResults);

const reportsDir = path.join(projectRoot, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}
const reportPath = path.join(reportsDir, 'jsdoc-coverage.md');
fs.writeFileSync(reportPath, reportContent);

console.log(`JSDoc coverage report generated at ${path.relative(projectRoot, reportPath).replace(/\\/g, '/')}`);
