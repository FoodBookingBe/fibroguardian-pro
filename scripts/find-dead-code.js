const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const reportsDir = path.join(__dirname, '..', 'reports');

// Ensure reports directory exists
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Run ts-prune to find unused exports
console.log('Running ts-prune to find unused exports...');
try {
  // ts-prune might exit with non-zero code if unused exports are found,
  // so we catch the error but still process stdout if available.
  let tsPruneOutput = '';
  try {
    tsPruneOutput = execSync('npx ts-prune -p tsconfig.json', { encoding: 'utf8' }); // Specify tsconfig
  } catch (e) {
    if (e.stdout) {
      tsPruneOutput = e.stdout.toString();
    } else {
      console.error('ts-prune execution failed with no output:', e.message);
    }
  }
  if (tsPruneOutput) {
    fs.writeFileSync(
      path.join(reportsDir, 'unused-exports.txt'),
      tsPruneOutput
    );
    console.log('Unused exports report saved to reports/unused-exports.txt');
  } else {
    console.log('No unused exports found by ts-prune or ts-prune failed to produce output.');
  }
} catch (error) {
  // This outer catch is for unexpected errors during the process itself
  console.error('Error running ts-prune process:', error);
}

// Run depcheck to find unused dependencies
console.log('Running depcheck to find unused dependencies...');
try {
  // depcheck might exit with non-zero code if issues are found.
  let depcheckOutput = '';
  try {
    depcheckOutput = execSync('npx depcheck --json', { encoding: 'utf8' });
  } catch (e) {
     if (e.stdout) {
      depcheckOutput = e.stdout.toString(); // depcheck outputs JSON error details to stdout on error
    } else {
      console.error('depcheck execution failed with no output:', e.message);
    }
  }
  if (depcheckOutput) {
    fs.writeFileSync(
      path.join(reportsDir, 'unused-dependencies.json'),
      depcheckOutput
    );
    console.log('Unused dependencies report saved to reports/unused-dependencies.json');
  } else {
     console.log('No unused dependencies found by depcheck or depcheck failed to produce output.');
  }
} catch (error) {
  console.error('Error running depcheck process:', error);
}

// Find console.log statements
console.log('Finding console.log statements (excluding node_modules and .next)...');
try {
  // Using a more robust grep command if available, or a simpler one as fallback
  // This command might vary based on OS (Linux/macOS vs Windows)
  // For cross-platform, a Node.js based search would be better, but grep is common.
  // The grep command provided in the plan might not work on all systems or without adjustments.
  // A simple Node.js alternative would be to read all files and regex match.
  // For now, assuming a POSIX-like environment where grep is available.
  const grepCommand = "grep -r --exclude-dir=node_modules --exclude-dir=.next --include='*.{ts,tsx,js,jsx}' 'console\\.log' . || true";
  const grepOutput = execSync(grepCommand, { encoding: 'utf8' });
  
  if (grepOutput.trim()) {
    fs.writeFileSync(
      path.join(reportsDir, 'console-logs.txt'),
      grepOutput
    );
    console.log('Console.log report saved to reports/console-logs.txt');
  } else {
    console.log('No console.log statements found.');
  }
} catch (error) {
  console.error('Error finding console.log statements:', error.message);
  console.log("Note: 'grep' command might not be available or might behave differently on your system.");
}

console.log('Code audit scripts complete. Reports are in the reports/ directory if issues were found.');
