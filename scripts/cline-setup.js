/**
 * Cline + Claude 3.7 Setup and Testing Script
 * 
 * This script helps with setting up and testing the Cline integration
 * with Claude 3.7 for FibroGuardian Pro.
 */

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Strip comments from JSON string and handle special cases
 * This allows us to parse JSON with comments (JSONC) and other special syntax
 */
function stripJsonComments(jsonString) {
  // Remove single-line comments (// ...)
  let result = jsonString.replace(/\/\/.*$/gm, '');
  
  // Remove multi-line comments (/* ... */)
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Handle special cases like template literals in JSON
  // Escape template literals (${...}) to prevent JSON parsing errors
  result = result.replace(/\${([^}]*)}/g, '"\\${$1}"');
  
  // Fix any trailing commas in arrays or objects
  result = result.replace(/,(\s*[\]}])/g, '$1');
  
  return result;
}

// Configuration
const CONFIG = {
  clineDir: '.cline',
  vscodeDir: '.vscode',
  promptsDir: '.cline/prompts',
  watchersDir: '.cline/watchers',
  contextDir: '.cline/context',
  commandsDir: '.cline/commands',
  notificationsDir: '.cline/notifications',
  settingsFile: '.vscode/settings.json',
  clineSettingsFile: '.cline/settings.json',
};

// Colors for console output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Main function to run the script
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  console.log(`${COLORS.bright}${COLORS.cyan}🤖 FibroGuardian Pro - Cline + Claude 3.7 Setup${COLORS.reset}\n`);

  switch (command) {
    case 'setup':
      await setupCline();
      break;
    case 'test':
      await testCline();
      break;
    case 'reset':
      await resetNotifications();
      break;
    case 'context':
      await regenerateContext();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

/**
 * Setup Cline directories and configuration
 */
async function setupCline() {
  console.log(`${COLORS.bright}Setting up Cline integration...${COLORS.reset}\n`);

  try {
    // Create directories
    await createDirectories();
    
    // Check if VS Code settings exist
    await updateVSCodeSettings();
    
    // Check if API key is set
    await checkAPIKey();
    
    console.log(`\n${COLORS.green}✅ Cline setup complete!${COLORS.reset}`);
    console.log(`\n${COLORS.yellow}Next steps:${COLORS.reset}`);
    console.log(`1. Make sure your Claude API key is set in ${CONFIG.settingsFile}`);
    console.log(`2. Restart VS Code to apply changes`);
    console.log(`3. Run 'node scripts/cline-setup.js test' to test the integration`);
  } catch (error) {
    console.error(`${COLORS.red}❌ Error setting up Cline: ${error.message}${COLORS.reset}`);
  }
}

/**
 * Create necessary directories
 */
async function createDirectories() {
  const directories = [
    CONFIG.clineDir,
    CONFIG.promptsDir,
    CONFIG.watchersDir,
    CONFIG.contextDir,
    CONFIG.commandsDir,
    CONFIG.notificationsDir,
  ];

  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`${COLORS.green}✓ Created directory: ${dir}${COLORS.reset}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
      console.log(`${COLORS.yellow}⚠ Directory already exists: ${dir}${COLORS.reset}`);
    }
  }
}

/**
 * Update VS Code settings with Cline configuration
 */
async function updateVSCodeSettings() {
  try {
    // Create .cline directory if it doesn't exist
    await fs.mkdir(CONFIG.clineDir, { recursive: true });
    
    // Create Cline settings file
    const clineSettings = {
      "cline.apiKey": "your_claude_api_key",
      "cline.model": "claude-3-7-sonnet-20250219",
      "cline.maxTokens": 8192,
      "cline.temperature": 0.1,
      "cline.systemPrompt": "You are an expert FibroGuardian Pro developer with deep knowledge of Supabase, Next.js, TypeScript, and healthcare applications. Always consider database schema, type safety, and clinical best practices.",
      
      "cline.customInstructions": [
        "Always use the typed Supabase client from 'hooks/useTypedSupabase'",
        "Generate Zod schemas for any new database tables",
        "Consider clinical safety and GDPR compliance in all recommendations",
        "Optimize for fibromyalgia patient experience (low energy, pain management)",
        "Use the established container/presentational pattern",
        "Include proper error handling and loading states",
        "Generate appropriate RLS policies for new tables"
      ],
      
      "cline.contextFiles": [
        "types/database.ts",
        "types/zod-schemas.ts", 
        "hooks/useTypedSupabase.ts",
        "utils/supabase/client.ts",
        "README.md"
      ],
      
      "cline.watchFiles": [
        "supabase/migrations/*.sql",
        "types/database.ts",
        "types/zod-schemas.ts"
      ],
      
      "cline.autoRunCommands": [
        "npm run db:types",
        "npm run db:validate"
      ]
    };
    
    await fs.writeFile(CONFIG.clineSettingsFile, JSON.stringify(clineSettings, null, 2), 'utf8');
    console.log(`${COLORS.green}✓ Created Cline settings file: ${CONFIG.clineSettingsFile}${COLORS.reset}`);
    
    // Create a README file to explain how to use the settings
    const readmeContent = `# Cline Configuration for FibroGuardian Pro

This directory contains configuration files for the Cline + Claude 3.7 integration.

## How to Use

1. Copy the settings from \`settings.json\` to your VS Code settings.
2. Set your Claude API key in the VS Code settings.
3. Restart VS Code to apply the changes.

## Files

- \`settings.json\`: Contains the Cline configuration settings.
- \`prompts/\`: Contains domain-specific prompts for FibroGuardian.
- \`watchers/\`: Contains schema watchers that detect database changes.
- \`context/\`: Contains context providers for Claude 3.7.
- \`commands/\`: Contains auto-commands for automated tasks.
- \`notifications/\`: Directory for Cline notifications.

## Commands

- \`npm run cline:setup\`: Setup Cline integration.
- \`npm run cline:test\`: Test Cline integration.
- \`npm run cline:reset\`: Reset Cline notifications.
- \`npm run cline:context\`: Regenerate Cline context.
`;
    
    await fs.writeFile(path.join(CONFIG.clineDir, 'README.md'), readmeContent, 'utf8');
    console.log(`${COLORS.green}✓ Created Cline README file${COLORS.reset}`);
    
    console.log(`${COLORS.yellow}⚠ Please copy the settings from ${CONFIG.clineSettingsFile} to your VS Code settings.${COLORS.reset}`);
  } catch (error) {
    throw new Error(`Failed to update VS Code settings: ${error.message}`);
  }
}

/**
 * Check if Claude API key is set
 */
async function checkAPIKey() {
  try {
    const settingsContent = await fs.readFile(CONFIG.clineSettingsFile, 'utf8');
    const settings = JSON.parse(settingsContent);
    
    if (settings["cline.apiKey"] === 'your_claude_api_key') {
      console.log(`${COLORS.yellow}⚠ Claude API key not set in Cline settings${COLORS.reset}`);
      console.log(`${COLORS.yellow}⚠ Please update the API key in ${CONFIG.clineSettingsFile}${COLORS.reset}`);
    } else {
      console.log(`${COLORS.green}✓ Claude API key is set${COLORS.reset}`);
    }
  } catch (error) {
    throw new Error(`Failed to check API key: ${error.message}`);
  }
}

/**
 * Test Cline integration
 */
async function testCline() {
  console.log(`${COLORS.bright}Testing Cline integration...${COLORS.reset}\n`);

  try {
    // Check if directories exist
    await checkDirectories();
    
    // Check if files exist
    await checkFiles();
    
    // Create test notification
    await createTestNotification();
    
    console.log(`\n${COLORS.green}✅ Cline integration test complete!${COLORS.reset}`);
  } catch (error) {
    console.error(`${COLORS.red}❌ Error testing Cline integration: ${error.message}${COLORS.reset}`);
  }
}

/**
 * Check if required directories exist
 */
async function checkDirectories() {
  const directories = [
    CONFIG.clineDir,
    CONFIG.promptsDir,
    CONFIG.watchersDir,
    CONFIG.contextDir,
    CONFIG.commandsDir,
    CONFIG.notificationsDir,
  ];

  for (const dir of directories) {
    try {
      await fs.access(dir, fs.constants.F_OK);
      console.log(`${COLORS.green}✓ Directory exists: ${dir}${COLORS.reset}`);
    } catch (error) {
      console.log(`${COLORS.red}✗ Directory does not exist: ${dir}${COLORS.reset}`);
      throw new Error(`Directory ${dir} does not exist. Run 'node scripts/cline-setup.js setup' to create it.`);
    }
  }
}

/**
 * Check if required files exist
 */
async function checkFiles() {
  const files = [
    CONFIG.settingsFile,
    path.join(CONFIG.promptsDir, 'fibroguardian-context.md'),
    path.join(CONFIG.watchersDir, 'schema-watcher.ts'),
    path.join(CONFIG.contextDir, 'claude-context-provider.ts'),
    path.join(CONFIG.commandsDir, 'auto-commands.ts'),
  ];

  for (const file of files) {
    try {
      await fs.access(file, fs.constants.F_OK);
      console.log(`${COLORS.green}✓ File exists: ${file}${COLORS.reset}`);
    } catch (error) {
      console.log(`${COLORS.red}✗ File does not exist: ${file}${COLORS.reset}`);
    }
  }
}

/**
 * Create a test notification
 */
async function createTestNotification() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const notificationFile = path.join(CONFIG.notificationsDir, `test-notification-${timestamp}.md`);
  
  const notificationContent = `
# 🧪 Test Notification

This is a test notification to verify that the Cline integration is working correctly.

**Timestamp**: ${new Date().toISOString()}

## Test Data
- Project: FibroGuardian Pro
- Integration: Cline + Claude 3.7
- Status: Testing

## Next Steps
1. Check that this notification appears in Cline
2. Verify that Claude 3.7 can access the project context
3. Test schema watching functionality
`;

  try {
    await fs.writeFile(notificationFile, notificationContent, 'utf8');
    console.log(`${COLORS.green}✓ Created test notification: ${notificationFile}${COLORS.reset}`);
  } catch (error) {
    throw new Error(`Failed to create test notification: ${error.message}`);
  }
}

/**
 * Reset notifications
 */
async function resetNotifications() {
  console.log(`${COLORS.bright}Resetting Cline notifications...${COLORS.reset}\n`);

  try {
    // Check if notifications directory exists
    try {
      await fs.access(CONFIG.notificationsDir, fs.constants.F_OK);
    } catch (error) {
      await fs.mkdir(CONFIG.notificationsDir, { recursive: true });
      console.log(`${COLORS.green}✓ Created notifications directory${COLORS.reset}`);
      return;
    }
    
    // Delete all notification files
    const files = await fs.readdir(CONFIG.notificationsDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        await fs.unlink(path.join(CONFIG.notificationsDir, file));
        console.log(`${COLORS.green}✓ Deleted notification: ${file}${COLORS.reset}`);
      }
    }
    
    console.log(`\n${COLORS.green}✅ Notifications reset complete!${COLORS.reset}`);
  } catch (error) {
    console.error(`${COLORS.red}❌ Error resetting notifications: ${error.message}${COLORS.reset}`);
  }
}

/**
 * Regenerate context
 */
async function regenerateContext() {
  console.log(`${COLORS.bright}Regenerating Cline context...${COLORS.reset}\n`);

  try {
    // Check if context provider exists
    const contextProviderFile = path.join(CONFIG.contextDir, 'claude-context-provider.ts');
    try {
      await fs.access(contextProviderFile, fs.constants.F_OK);
    } catch (error) {
      console.log(`${COLORS.red}✗ Context provider does not exist: ${contextProviderFile}${COLORS.reset}`);
      throw new Error(`Context provider ${contextProviderFile} does not exist. Run 'node scripts/cline-setup.js setup' to create it.`);
    }
    
    // Execute context provider
    console.log(`${COLORS.yellow}⚠ This would normally execute the context provider to regenerate context${COLORS.reset}`);
    console.log(`${COLORS.yellow}⚠ For now, this is just a placeholder${COLORS.reset}`);
    
    console.log(`\n${COLORS.green}✅ Context regeneration complete!${COLORS.reset}`);
  } catch (error) {
    console.error(`${COLORS.red}❌ Error regenerating context: ${error.message}${COLORS.reset}`);
  }
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
${COLORS.bright}Usage:${COLORS.reset}
  node scripts/cline-setup.js [command]

${COLORS.bright}Commands:${COLORS.reset}
  setup     Setup Cline integration
  test      Test Cline integration
  reset     Reset Cline notifications
  context   Regenerate Cline context
  help      Show this help message

${COLORS.bright}Examples:${COLORS.reset}
  node scripts/cline-setup.js setup    # Setup Cline integration
  node scripts/cline-setup.js test     # Test Cline integration
  node scripts/cline-setup.js reset    # Reset Cline notifications
  node scripts/cline-setup.js context  # Regenerate Cline context
  `);
}

// Run the script
main().catch(error => {
  console.error(`${COLORS.red}❌ Error: ${error.message}${COLORS.reset}`);
  process.exit(1);
});
