/**
 * Bundle Analyzer Script
 * 
 * This script runs the Next.js application with bundle analysis enabled.
 * It generates a visual report of the JavaScript bundle composition,
 * which can help identify large dependencies and optimization opportunities.
 * 
 * Usage:
 * 1. Run `node scripts/analyze-bundle.js` to analyze the production build
 * 2. Open the generated report in your browser (usually at http://localhost:8888)
 * 3. Look for large chunks and modules that could be optimized
 * 
 * Optimization strategies based on analysis:
 * - Replace large libraries with smaller alternatives
 * - Use dynamic imports for code splitting
 * - Lazy load components and routes that aren't needed immediately
 * - Remove unused dependencies and code
 * - Configure webpack to better tree-shake dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create reports directory if it doesn't exist
const reportsDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir);
}

// Get current date for report naming
const date = new Date();
const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

console.log('🔍 Starting bundle analysis...');

try {
  // Run Next.js build with bundle analyzer enabled
  execSync('ANALYZE=true npm run build', { 
    stdio: 'inherit',
    env: { ...process.env, ANALYZE: 'true' }
  });
  
  console.log('✅ Bundle analysis complete!');
  console.log('📊 Check the browser for the visual report.');
  
  // Save a record of the analysis run
  const logEntry = `Bundle analysis run on ${date.toISOString()}\n`;
  fs.appendFileSync(path.join(reportsDir, 'bundle-analysis-log.txt'), logEntry);
  
  console.log('\nRecommended next steps:');
  console.log('1. Look for large chunks and modules in the report');
  console.log('2. Identify opportunities for code splitting and lazy loading');
  console.log('3. Consider replacing large dependencies with smaller alternatives');
  console.log('4. Update the optimization checklist with your findings');
  
} catch (error) {
  console.error('❌ Bundle analysis failed:', error.message);
  process.exit(1);
}
