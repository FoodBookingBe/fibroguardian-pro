import { clineSchemaWatcher } from '../watchers/schema-watcher';

export class ClaudeContextProvider {
  async generateContext(): Promise<string> {
    const context = await this.buildFullContext();
    return context;
  }

  private async buildFullContext(): Promise<string> {
    const schemaContext = await clineSchemaWatcher.getSchemaContext();
    const projectContext = await this.getProjectContext();
    const healthcareContext = this.getHealthcareContext();

    return `
# 🏥 FibroGuardian Pro - AI Development Context

${projectContext}

${schemaContext}

${healthcareContext}

## Development Instructions for Claude 3.7

### 🎯 Primary Objectives
1. **Clinical Safety**: All health-related features must be medically appropriate
2. **Type Safety**: 100% TypeScript coverage with runtime validation
3. **User Experience**: Optimize for low-energy fibromyalgia patients
4. **Performance**: Fast loading, minimal cognitive load
5. **Privacy**: GDPR compliant, secure health data handling

### 🤖 AI Integration Guidelines
- Use confidence scores for all AI recommendations
- Include clinical reasoning in AI outputs
- Provide alternative options for AI suggestions
- Respect user autonomy in health decisions
- Consider pain/fatigue levels in UI adaptations

### 🗄️ Database Best Practices
- Always use \`useTypedSupabase()\` hook
- Validate data with Zod schemas before DB operations
- Implement proper RLS for all health data
- Consider data retention and archival policies
- Optimize queries for patient dashboard performance

### 🎨 UI/UX Principles
- Adaptive UI based on user energy levels
- High contrast options for pain episodes
- Simplified navigation for cognitive impairment
- Progress indicators for complex operations
- Accessible design (WCAG 2.1 AA minimum)

### 🔧 Code Generation Rules
When generating code:
1. Include proper TypeScript types
2. Add error handling and loading states
3. Implement proper validation
4. Consider mobile-first responsive design
5. Include accessibility attributes
6. Add relevant documentation/comments

### 🚨 Critical Considerations
- **Never generate medical advice** - only track and analyze
- **Validate all health data** before storage
- **Respect patient privacy** in all operations
- **Consider emergency scenarios** in symptom tracking
- **Optimize for interrupted usage** (pain episodes)
`;
  }

  private async getProjectContext(): Promise<string> {
    try {
      const fs = await import('fs/promises');
      const packageJsonPath = 'package.json';
      const packageJsonExists = await fs.access(packageJsonPath).then(() => true).catch(() => false);
      
      if (packageJsonExists) {
        const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonContent);
        
        return `
## 📦 Project Information
- **Name**: ${packageJson.name || 'FibroGuardian Pro'}
- **Version**: ${packageJson.version || '1.0.0'}
- **Framework**: Next.js 14 with TypeScript
- **Database**: Supabase (PostgreSQL)
- **State Management**: TanStack Query v5
- **UI**: Tailwind CSS with custom components
- **AI**: OpenAI GPT-4 + custom ML models
`;
      }
    } catch (error) {
      console.error('Error reading package.json:', error);
    }
    
    return `
## 📦 Project Information
- **Name**: FibroGuardian Pro
- **Version**: 1.0.0
- **Framework**: Next.js 14 with TypeScript
- **Database**: Supabase (PostgreSQL)
- **State Management**: TanStack Query v5
- **UI**: Tailwind CSS with custom components
- **AI**: OpenAI GPT-4 + custom ML models
`;
  }

  private getHealthcareContext(): string {
    return `
## 🏥 Healthcare Domain Context

### Fibromyalgia Overview
- **Chronic pain condition** affecting muscles, joints, and soft tissues
- **Symptoms**: Widespread pain, fatigue, cognitive issues ("fibro fog")
- **Management**: Pacing activities, stress reduction, medication, exercise
- **Patient Needs**: Energy management, pain tracking, specialist communication

### Clinical Data Points
- **Pain Scale**: 1-10 numeric rating scale
- **Energy Levels**: Before/after activity tracking
- **Fatigue**: Daily fatigue assessment
- **Activities**: Type, duration, intensity tracking
- **Medications**: Adherence and effectiveness
- **Sleep**: Quality and duration patterns

### Regulatory Considerations
- **GDPR Compliance**: EU patient data protection
- **Medical Device Regulation**: Potential MDR classification
- **Clinical Validation**: Evidence-based recommendations only
- **Data Retention**: Healthcare-specific retention policies

### Patient Safety
- **Symptom Monitoring**: Detect concerning patterns
- **Escalation Protocols**: When to recommend specialist contact
- **Emergency Situations**: Severe symptom spikes
- **Medication Safety**: Interaction checking, adherence monitoring
`;
  }
}

export const claudeContextProvider = new ClaudeContextProvider();
