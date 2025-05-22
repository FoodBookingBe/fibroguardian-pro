/**
 * Memory Leak Detection Script
 * 
 * This script analyzes React components for potential memory leaks by:
 * 1. Checking for missing useEffect cleanup functions
 * 2. Identifying event listeners that aren't properly removed
 * 3. Detecting state updates in unmounted components
 * 4. Finding circular references in state or props
 */

import fs from 'fs';
import path from 'path';

import * as glob from 'glob';

// Configuration
const CONTAINERS_DIR = path.join(process.cwd(), 'containers');
const COMPONENTS_DIR = path.join(process.cwd(), 'components');
const REPORT_FILE = path.join(process.cwd(), 'reports', 'memory-leak-report.md');

// Patterns to look for
const MEMORY_LEAK_PATTERNS = {
  MISSING_CLEANUP: /useEffect\(\s*\(\s*\)\s*=>\s*\{(?!\s*return)/g,
  EVENT_LISTENER: /addEventListener|on\w+\s*=/g,
  REMOVE_LISTENER: /removeEventListener/g,
  SET_STATE_WITHOUT_CHECK: /set\w+\s*\(/g,
  IS_MOUNTED_CHECK: /isMounted|mounted\.current/g,
  CIRCULAR_REFERENCE: /useRef\(\s*\{\s*.*\s*\}\s*\)/g,
};

/**
 * Parse a file and check for potential memory leaks
 * @param {string} filePath - Path to the file to check
 * @returns {Array} - Array of potential memory leak issues
 */
function checkFileForMemoryLeaks(filePath) {
  const issues = [];
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Simple pattern matching for quick checks
  for (const [type, pattern] of Object.entries(MEMORY_LEAK_PATTERNS)) {
    const matches = content.match(pattern);
    if (matches) {
      if (type === 'MISSING_CLEANUP') {
        // Check if there are useEffect hooks without cleanup
        const useEffectCount = (content.match(/useEffect/g) || []).length;
        const returnCount = (content.match(/useEffect\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?return\s+/g) || []).length;
        
        if (useEffectCount > returnCount) {
          issues.push({
            type: 'MISSING_CLEANUP',
            message: `Missing cleanup in useEffect (${useEffectCount - returnCount} instances)`,
            line: findLineNumber(content, 'useEffect'),
          });
        }
      } else if (type === 'EVENT_LISTENER') {
        // Check if event listeners are added without being removed
        const addListenerCount = (content.match(MEMORY_LEAK_PATTERNS.EVENT_LISTENER) || []).length;
        const removeListenerCount = (content.match(MEMORY_LEAK_PATTERNS.REMOVE_LISTENER) || []).length;
        
        if (addListenerCount > removeListenerCount) {
          issues.push({
            type: 'EVENT_LISTENER',
            message: `Event listeners may not be properly removed (${addListenerCount - removeListenerCount} instances)`,
            line: findLineNumber(content, 'addEventListener'),
          });
        }
      } else if (type === 'SET_STATE_WITHOUT_CHECK') {
        // Check if setState is called without checking if component is mounted
        const setStateCount = (content.match(MEMORY_LEAK_PATTERNS.SET_STATE_WITHOUT_CHECK) || []).length;
        const isMountedCheckCount = (content.match(MEMORY_LEAK_PATTERNS.IS_MOUNTED_CHECK) || []).length;
        
        if (setStateCount > 0 && isMountedCheckCount === 0 && content.includes('async')) {
          issues.push({
            type: 'SET_STATE_WITHOUT_CHECK',
            message: 'setState may be called after component unmount in async functions',
            line: findLineNumber(content, 'set'),
          });
        }
      } else if (type === 'CIRCULAR_REFERENCE') {
        issues.push({
          type: 'CIRCULAR_REFERENCE',
          message: 'Potential circular reference in useRef',
          line: findLineNumber(content, 'useRef'),
        });
      }
    }
  }
  
  // Check for setTimeout/setInterval without clearTimeout/clearInterval
  if (content.includes('setTimeout') || content.includes('setInterval')) {
    const hasSetTimeout = content.includes('setTimeout');
    const hasSetInterval = content.includes('setInterval');
    const hasClearTimeout = content.includes('clearTimeout');
    const hasClearInterval = content.includes('clearInterval');
    
    if (hasSetTimeout && !hasClearTimeout) {
      issues.push({
        type: 'TIMER_NOT_CLEARED',
        message: 'setTimeout is used without clearTimeout',
        line: findLineNumber(content, 'setTimeout'),
      });
    }
    
    if (hasSetInterval && !hasClearInterval) {
      issues.push({
        type: 'TIMER_NOT_CLEARED',
        message: 'setInterval is used without clearInterval',
        line: findLineNumber(content, 'setInterval'),
      });
    }
  }
  
  return issues;
}

/**
 * Find the line number of a pattern in a string
 * @param {string} content - The content to search in
 * @param {string} pattern - The pattern to search for
 * @returns {number} - The line number
 */
function findLineNumber(content, pattern) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(pattern)) {
      return i + 1;
    }
  }
  return 0;
}

/**
 * Check all container components for memory leaks
 */
function checkContainers() {
  const containerFiles = glob.sync(`${CONTAINERS_DIR}/**/*.{tsx,jsx}`);
  const componentFiles = glob.sync(`${COMPONENTS_DIR}/**/*.{tsx,jsx}`);
  const allFiles = [...containerFiles, ...componentFiles];
  
  console.log(`Checking ${allFiles.length} files for memory leaks...`);
  
  const results = {};
  let totalIssues = 0;
  
  for (const file of allFiles) {
    const issues = checkFileForMemoryLeaks(file);
    if (issues.length > 0) {
      results[file] = issues;
      totalIssues += issues.length;
    }
  }
  
  // Generate report
  const reportDir = path.dirname(REPORT_FILE);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  let report = `# Memory Leak Analysis Report\n\n`;
  report += `Generated on: ${new Date().toLocaleString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- Total files checked: ${allFiles.length}\n`;
  report += `- Files with potential issues: ${Object.keys(results).length}\n`;
  report += `- Total potential issues: ${totalIssues}\n\n`;
  
  if (totalIssues > 0) {
    report += `## Detailed Findings\n\n`;
    
    for (const [file, issues] of Object.entries(results)) {
      const relativePath = path.relative(process.cwd(), file);
      report += `### ${relativePath}\n\n`;
      
      for (const issue of issues) {
        report += `- **${issue.type}**: ${issue.message} (line ${issue.line})\n`;
      }
      
      report += `\n`;
    }
    
    report += `## Recommendations\n\n`;
    report += `1. **Add cleanup functions to useEffect hooks**:\n`;
    report += `   \`\`\`jsx\n`;
    report += `   useEffect(() => {\n`;
    report += `     const subscription = someAPI.subscribe();\n`;
    report += `     return () => {\n`;
    report += `       subscription.unsubscribe();\n`;
    report += `     };\n`;
    report += `   }, []);\n`;
    report += `   \`\`\`\n\n`;
    
    report += `2. **Use a mounted ref to prevent state updates after unmount**:\n`;
    report += `   \`\`\`jsx\n`;
    report += `   const isMounted = useRef(true);\n`;
    report += `   useEffect(() => {\n`;
    report += `     return () => {\n`;
    report += `       isMounted.current = false;\n`;
    report += `     };\n`;
    report += `   }, []);\n\n`;
    report += `   // Later in async functions\n`;
    report += `   if (isMounted.current) {\n`;
    report += `     setState(newValue);\n`;
    report += `   }\n`;
    report += `   \`\`\`\n\n`;
    
    report += `3. **Always clean up event listeners**:\n`;
    report += `   \`\`\`jsx\n`;
    report += `   useEffect(() => {\n`;
    report += `     window.addEventListener('resize', handleResize);\n`;
    report += `     return () => {\n`;
    report += `       window.removeEventListener('resize', handleResize);\n`;
    report += `     };\n`;
    report += `   }, []);\n`;
    report += `   \`\`\`\n\n`;
    
    report += `4. **Clear timers**:\n`;
    report += `   \`\`\`jsx\n`;
    report += `   useEffect(() => {\n`;
    report += `     const timerId = setTimeout(callback, 1000);\n`;
    report += `     return () => {\n`;
    report += `       clearTimeout(timerId);\n`;
    report += `     };\n`;
    report += `   }, []);\n`;
    report += `   \`\`\`\n\n`;
  } else {
    report += `## No issues found\n\n`;
    report += `No potential memory leaks were detected in the codebase. Great job!\n\n`;
  }
  
  fs.writeFileSync(REPORT_FILE, report);
  
  console.log(`Memory leak analysis complete. Report saved to ${REPORT_FILE}`);
  console.log(`Found ${totalIssues} potential issues in ${Object.keys(results).length} files.`);
  
  return { totalIssues, filesWithIssues: Object.keys(results).length };
}

// Run the check
checkContainers();
