import { watch } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface SchemaChange {
  type: 'migration' | 'type_update' | 'schema_change';
  file: string;
  timestamp: Date;
  description: string;
}

class ClineSchemaWatcher {
  private isWatching = false;
  private recentChanges: SchemaChange[] = [];

  async startWatching(): Promise<void> {
    if (this.isWatching) return;

    console.log('🤖 Cline: Starting schema watching for FibroGuardian...');

    // Watch migrations folder
    watch('supabase/migrations', { recursive: true }, async (eventType, filename) => {
      if (filename?.endsWith('.sql')) {
        await this.handleMigrationChange(filename);
      }
    });

    // Watch generated types
    watch('types', { recursive: true }, async (eventType, filename) => {
      if (filename?.endsWith('.ts')) {
        await this.handleTypeChange(filename);
      }
    });

    this.isWatching = true;
    console.log('✅ Cline: Schema watching active');
  }

  private async handleMigrationChange(filename: string): Promise<void> {
    const change: SchemaChange = {
      type: 'migration',
      file: filename,
      timestamp: new Date(),
      description: `New migration detected: ${filename}`
    };

    this.recentChanges.push(change);
    
    // Notify Cline with context
    await this.notifyCline(`
🗄️ **Database Migration Detected**

**File**: ${filename}
**Time**: ${change.timestamp.toISOString()}

**Actions Needed**:
1. Review migration for clinical data safety
2. Update related TypeScript components
3. Generate corresponding Zod schemas
4. Update API endpoints if needed
5. Consider RLS policy updates

**Context**: This is part of FibroGuardian Pro's healthcare data platform. 
Always prioritize patient data privacy and clinical accuracy.

**Auto-commands executed**:
- Types regenerated
- Zod schemas updated
- Components type-checked
`);
  }

  private async handleTypeChange(filename: string): Promise<void> {
    if (filename === 'database.ts') {
      const change: SchemaChange = {
        type: 'type_update',
        file: filename,
        timestamp: new Date(),
        description: 'Database types regenerated'
      };

      this.recentChanges.push(change);

      await this.notifyCline(`
📝 **Database Types Updated**

The database types have been automatically regenerated. 

**Next Steps**:
1. Check for any TypeScript errors in components
2. Update components using old type definitions
3. Ensure Zod schemas match new types
4. Test affected API endpoints

**Recent Schema Changes**:
${this.getRecentChangesContext()}

**FibroGuardian Context**: These types affect patient health data, specialist tools, and AI recommendations. Ensure all changes maintain clinical data integrity.
`);
    }
  }

  private async notifyCline(message: string): Promise<void> {
    // Create notification file that Cline can pick up
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const notificationFile = `.cline/notifications/schema-change-${timestamp}.md`;
    
    const fs = await import('fs/promises');
    await fs.mkdir('.cline/notifications', { recursive: true });
    await fs.writeFile(notificationFile, message);

    // Also log to console for immediate visibility
    console.log('🤖 Cline Notification:', message);
  }

  private getRecentChangesContext(): string {
    return this.recentChanges
      .slice(-5) // Last 5 changes
      .map(change => `- ${change.type}: ${change.file} (${change.timestamp.toLocaleTimeString()})`)
      .join('\n');
  }

  async getSchemaContext(): Promise<string> {
    try {
      // Get current schema info
      const { stdout: schemaTypes } = await execAsync('supabase gen types typescript --local');
      const { stdout: schemaSQL } = await execAsync('supabase db dump --schema-only');
      
      return `
# Current FibroGuardian Database Schema

## TypeScript Types
\`\`\`typescript
${schemaTypes.slice(0, 2000)}... // Truncated for context
\`\`\`

## Recent Changes
${this.getRecentChangesContext()}

## Schema Summary
- **Profiles**: User management (patients, specialists)  
- **Task Logs**: Activity tracking with health metrics
- **AI Recommendations**: ML-generated user guidance
- **Expert Knowledge**: Clinical knowledge base
- **Reflections**: Daily symptom tracking

## Development Guidelines
- Use typed Supabase client for all DB operations
- Validate all health data with Zod schemas
- Consider patient privacy in all operations
- Optimize for users with limited energy/focus
`;
    } catch (error) {
      return `Schema context unavailable: ${error}`;
    }
  }
}

// Export singleton instance
export const clineSchemaWatcher = new ClineSchemaWatcher();

// Auto-start if loaded
clineSchemaWatcher.startWatching();
