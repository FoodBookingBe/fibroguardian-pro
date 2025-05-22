interface ClineCommand {
  trigger: string;
  command: string;
  description: string;
  autoRun?: boolean;
}

export const fibroGuardianCommands: ClineCommand[] = [
  {
    trigger: 'schema_change',
    command: 'npm run db:types && npm run db:validate',
    description: 'Regenerate types and validate schema',
    autoRun: true
  },
  {
    trigger: 'migration_added',
    command: 'supabase db push && npm run db:types',
    description: 'Apply migration and update types',
    autoRun: false // Require manual confirmation
  },
  {
    trigger: 'component_created',
    command: 'npm run type-check',
    description: 'Type check new component',
    autoRun: true
  },
  {
    trigger: 'api_route_added',
    command: 'npm run test:api',
    description: 'Test new API route',
    autoRun: false
  }
];

// Cline command executor
export class ClineCommandExecutor {
  async executeCommand(trigger: string, context?: any): Promise<void> {
    const command = fibroGuardianCommands.find(cmd => cmd.trigger === trigger);
    
    if (!command) {
      console.log(`No command found for trigger: ${trigger}`);
      return;
    }

    if (command.autoRun) {
      console.log(`🤖 Auto-executing: ${command.description}`);
      // Execute command
      const { exec } = await import('child_process');
      exec(command.command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Command failed: ${error}`);
        } else {
          console.log(`✅ Command completed: ${command.description}`);
        }
      });
    } else {
      console.log(`⏸️  Manual confirmation required for: ${command.description}`);
      console.log(`Command: ${command.command}`);
    }
  }
}

export const commandExecutor = new ClineCommandExecutor();
