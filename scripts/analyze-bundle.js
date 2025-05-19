/**
 * Bundle Analyzer Script
 * 
 * This script analyzes the Next.js bundle to identify large dependencies
 * and opportunities for optimization.
 * 
 * Usage:
 *   node scripts/analyze-bundle.js
 * 
 * Or use the provided npm script:
 *   npm run analyze-bundle
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BUNDLE_REPORT_DIR = path.join(process.cwd(), '.next/analyze');
const BUNDLE_REPORT_HTML = path.join(BUNDLE_REPORT_DIR, 'bundle-report.html');
const UNUSED_DEPS_REPORT = path.join(process.cwd(), 'reports/unused-dependencies.json');
const SIZE_THRESHOLD_KB = 100; // Report dependencies larger than this threshold

// Ensure the report directory exists
if (!fs.existsSync(BUNDLE_REPORT_DIR)) {
  fs.mkdirSync(BUNDLE_REPORT_DIR, { recursive: true });
}

// Ensure the reports directory exists
const reportsDir = path.join(process.cwd(), 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

/**
 * Run the Next.js bundle analyzer
 */
function analyzeBundleSize() {
  console.log('📊 Analyzing bundle size...');
  
  try {
    // Set environment variables for Next.js bundle analyzer
    process.env.ANALYZE = 'true';
    process.env.BUNDLE_ANALYZE = 'browser';
    
    // Build the Next.js application with bundle analyzer
    execSync('next build', { stdio: 'inherit' });
    
    console.log(`\n✅ Bundle analysis complete. Report saved to ${BUNDLE_REPORT_HTML}`);
    console.log('   Open this file in your browser to view the detailed report.');
    
    // Copy the report to a more accessible location
    if (fs.existsSync('.next/analyze/client.html')) {
      fs.copyFileSync('.next/analyze/client.html', BUNDLE_REPORT_HTML);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to analyze bundle:', error.message);
    return false;
  }
}

/**
 * Find unused dependencies in the project
 */
function findUnusedDependencies() {
  console.log('\n🔍 Finding unused dependencies...');
  
  try {
    // Install depcheck if not already installed
    try {
      execSync('npx depcheck --version', { stdio: 'ignore' });
    } catch (e) {
      console.log('Installing depcheck...');
      execSync('npm install -g depcheck', { stdio: 'inherit' });
    }
    
    // Run depcheck and capture the output
    const depcheckOutput = execSync('npx depcheck --json', { encoding: 'utf8' });
    const depcheckResult = JSON.parse(depcheckOutput);
    
    // Save the result to a file
    fs.writeFileSync(
      UNUSED_DEPS_REPORT,
      JSON.stringify(depcheckResult, null, 2)
    );
    
    // Display the unused dependencies
    if (depcheckResult.dependencies.length > 0) {
      console.log('\n⚠️ Unused dependencies found:');
      depcheckResult.dependencies.forEach(dep => {
        console.log(`   - ${dep}`);
      });
      console.log(`\n   Consider removing these dependencies to reduce bundle size.`);
    } else {
      console.log('\n✅ No unused dependencies found.');
    }
    
    return depcheckResult.dependencies;
  } catch (error) {
    console.error('❌ Failed to find unused dependencies:', error.message);
    return [];
  }
}

/**
 * Analyze the package.json to find large dependencies
 */
function analyzeDependencySizes() {
  console.log('\n📏 Analyzing dependency sizes...');
  
  try {
    // Install package-size if not already installed
    try {
      execSync('npx package-size --version', { stdio: 'ignore' });
    } catch (e) {
      console.log('Installing package-size...');
      execSync('npm install -g package-size', { stdio: 'inherit' });
    }
    
    // Get the list of dependencies from package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    
    // Get the size of each dependency
    const dependencySizes = [];
    
    console.log('\n   Checking dependency sizes (this may take a while)...');
    
    for (const [name, version] of Object.entries(dependencies)) {
      try {
        const sizeOutput = execSync(`npx package-size ${name} --json`, { encoding: 'utf8' });
        const sizeInfo = JSON.parse(sizeOutput);
        
        // Convert to KB
        const sizeKB = Math.round(sizeInfo.size / 1024);
        
        if (sizeKB > SIZE_THRESHOLD_KB) {
          dependencySizes.push({ name, version, sizeKB });
        }
      } catch (e) {
        // Skip dependencies that can't be analyzed
      }
    }
    
    // Sort by size (largest first)
    dependencySizes.sort((a, b) => b.sizeKB - a.sizeKB);
    
    // Display the large dependencies
    if (dependencySizes.length > 0) {
      console.log(`\n⚠️ Large dependencies (>${SIZE_THRESHOLD_KB}KB):`);
      dependencySizes.forEach(dep => {
        console.log(`   - ${dep.name}@${dep.version}: ${dep.sizeKB}KB`);
      });
      console.log('\n   Consider alternatives or code splitting for these dependencies.');
    } else {
      console.log(`\n✅ No dependencies larger than ${SIZE_THRESHOLD_KB}KB found.`);
    }
    
    return dependencySizes;
  } catch (error) {
    console.error('❌ Failed to analyze dependency sizes:', error.message);
    return [];
  }
}

/**
 * Find duplicate packages in node_modules
 */
function findDuplicatePackages() {
  console.log('\n🔄 Finding duplicate packages...');
  
  try {
    // Install npm-check if not already installed
    try {
      execSync('npx npm-check --version', { stdio: 'ignore' });
    } catch (e) {
      console.log('Installing npm-check...');
      execSync('npm install -g npm-check', { stdio: 'inherit' });
    }
    
    // Run npm-check and capture the output
    const npmCheckOutput = execSync('npx npm-check --skip-unused --json', { encoding: 'utf8' });
    const npmCheckResult = JSON.parse(npmCheckOutput);
    
    // Find packages with duplicates
    const duplicates = npmCheckResult.filter(pkg => pkg.duplicated);
    
    // Display the duplicate packages
    if (duplicates.length > 0) {
      console.log('\n⚠️ Duplicate packages found:');
      duplicates.forEach(pkg => {
        console.log(`   - ${pkg.moduleName}: ${pkg.installed} (duplicates: ${pkg.duplicated.join(', ')})`);
      });
      console.log('\n   Consider deduplicating these packages to reduce bundle size.');
    } else {
      console.log('\n✅ No duplicate packages found.');
    }
    
    return duplicates;
  } catch (error) {
    console.error('❌ Failed to find duplicate packages:', error.message);
    return [];
  }
}

/**
 * Generate optimization recommendations based on the analysis
 */
function generateRecommendations(unusedDeps, largeDeps, duplicates) {
  console.log('\n📝 Generating optimization recommendations...');
  
  const recommendations = [];
  
  // Recommendations for unused dependencies
  if (unusedDeps.length > 0) {
    recommendations.push({
      title: 'Remove unused dependencies',
      description: `Remove ${unusedDeps.length} unused dependencies to reduce bundle size.`,
      action: `npm uninstall ${unusedDeps.join(' ')}`,
      impact: 'Medium'
    });
  }
  
  // Recommendations for large dependencies
  if (largeDeps.length > 0) {
    largeDeps.forEach(dep => {
      recommendations.push({
        title: `Optimize ${dep.name} usage`,
        description: `${dep.name} is ${dep.sizeKB}KB in size. Consider code splitting or finding a lighter alternative.`,
        action: `Implement dynamic import for ${dep.name} or replace with a lighter alternative.`,
        impact: 'High'
      });
    });
  }
  
  // Recommendations for duplicate packages
  if (duplicates.length > 0) {
    recommendations.push({
      title: 'Deduplicate packages',
      description: `Deduplicate ${duplicates.length} packages to reduce bundle size.`,
      action: 'Run "npm dedupe" to deduplicate packages.',
      impact: 'Medium'
    });
  }
  
  // General recommendations
  recommendations.push({
    title: 'Implement code splitting',
    description: 'Use dynamic imports to split code into smaller chunks that can be loaded on demand.',
    action: 'Identify large components and convert them to use dynamic imports.',
    impact: 'High'
  });
  
  recommendations.push({
    title: 'Optimize images',
    description: 'Use Next.js Image component to automatically optimize images.',
    action: 'Replace <img> tags with Next.js <Image> component.',
    impact: 'High'
  });
  
  recommendations.push({
    title: 'Implement tree shaking',
    description: 'Ensure your code is tree-shakable to eliminate dead code.',
    action: 'Use ES modules and avoid side effects in module imports.',
    impact: 'Medium'
  });
  
  // Display the recommendations
  console.log('\n🚀 Optimization recommendations:');
  recommendations.forEach((rec, index) => {
    console.log(`\n   ${index + 1}. ${rec.title} (Impact: ${rec.impact})`);
    console.log(`      ${rec.description}`);
    console.log(`      Action: ${rec.action}`);
  });
  
  return recommendations;
}

/**
 * Main function to run the analysis
 */
function main() {
  console.log('🔍 Starting bundle analysis...\n');
  
  // Run the analyses
  const bundleAnalysisSuccess = analyzeBundleSize();
  const unusedDeps = findUnusedDependencies();
  const largeDeps = analyzeDependencySizes();
  const duplicates = findDuplicatePackages();
  
  // Generate recommendations
  const recommendations = generateRecommendations(unusedDeps, largeDeps, duplicates);
  
  console.log('\n✅ Bundle analysis complete!');
  
  if (bundleAnalysisSuccess) {
    console.log(`\n   View the detailed bundle report at: ${BUNDLE_REPORT_HTML}`);
  }
  
  console.log('\n   Follow the optimization recommendations to improve your bundle size and performance.');
}

// Run the main function
main();
