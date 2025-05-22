/**
 * Changelog System for FibroGuardian Pro
 * 
 * This module provides a structured way to track changes to the system,
 * including features, improvements, bugfixes, and optimizations.
 * It helps maintain a clear history of modifications and their impact.
 */

export type ChangeCategory = 'ai' | 'frontend' | 'backend' | 'security' | 'performance' | 'ux' | 'database';
export type ChangeType = 'feature' | 'improvement' | 'bugfix' | 'optimization' | 'refactor' | 'security';
export type ChangeImpact = 'low' | 'medium' | 'high' | 'critical';

export interface ChangelogEntry {
  version: string;
  timestamp: Date;
  category: ChangeCategory;
  type: ChangeType;
  description: string;
  impact: ChangeImpact;
  tested: boolean;
  rollbackPlan?: string;
  author?: string;
  prNumber?: number;
  relatedIssues?: string[];
}

/**
 * The main changelog array containing all changes to the system
 */
export const changelog: ChangelogEntry[] = [
  {
    version: '2.0.0',
    timestamp: new Date('2025-05-22T11:00:00'),
    category: 'ai',
    type: 'feature',
    description: 'Geïmplementeerd modulaire AI-architectuur met AI Assistant, Recommendations en Knowledge Management',
    impact: 'high',
    tested: true,
    rollbackPlan: 'Terug naar v1.5.2 AI-service',
    author: 'AI Team',
    relatedIssues: ['AI-001', 'AI-002', 'AI-003']
  },
  {
    version: '2.0.0',
    timestamp: new Date('2025-05-22T11:30:00'),
    category: 'frontend',
    type: 'feature',
    description: 'Specialist Intelligence Dashboard toegevoegd met predictieve analyses en behandeleffectiviteit',
    impact: 'high',
    tested: true,
    rollbackPlan: 'Verwijder dashboard componenten en routes',
    author: 'Frontend Team',
    relatedIssues: ['FE-042', 'AI-004']
  },
  {
    version: '2.0.0',
    timestamp: new Date('2025-05-22T10:15:00'),
    category: 'backend',
    type: 'feature',
    description: 'AI Recommendations API endpoints geïmplementeerd met Zod validatie',
    impact: 'medium',
    tested: true,
    rollbackPlan: 'Verwijder API routes en database tabellen',
    author: 'Backend Team',
    relatedIssues: ['BE-078', 'AI-005']
  },
  {
    version: '2.0.0',
    timestamp: new Date('2025-05-22T09:45:00'),
    category: 'database',
    type: 'feature',
    description: 'Nieuwe database tabellen voor expert_knowledge en ai_recommendations',
    impact: 'high',
    tested: true,
    rollbackPlan: 'Uitvoeren van rollback migratie script',
    author: 'Database Team',
    relatedIssues: ['DB-034', 'AI-006']
  },
  {
    version: '2.0.0',
    timestamp: new Date('2025-05-22T10:30:00'),
    category: 'security',
    type: 'improvement',
    description: 'Row Level Security policies toegevoegd voor AI-gerelateerde tabellen',
    impact: 'high',
    tested: true,
    rollbackPlan: 'Verwijder RLS policies',
    author: 'Security Team',
    relatedIssues: ['SEC-012', 'DB-035']
  }
];

/**
 * Add a new entry to the changelog
 * @param entry The changelog entry to add
 */
export function addChangelogEntry(entry: ChangelogEntry): void {
  changelog.push(entry);
  
  // In a real implementation, this would save to a database or file
  console.log(`Added changelog entry: ${entry.description}`);
}

/**
 * Get all changelog entries for a specific version
 * @param version The version to filter by
 * @returns Array of changelog entries for the specified version
 */
export function getChangelogForVersion(version: string): ChangelogEntry[] {
  return changelog.filter(entry => entry.version === version);
}

/**
 * Get all changelog entries for a specific category
 * @param category The category to filter by
 * @returns Array of changelog entries for the specified category
 */
export function getChangelogByCategory(category: ChangeCategory): ChangelogEntry[] {
  return changelog.filter(entry => entry.category === category);
}

/**
 * Get all changelog entries with a specific impact level or higher
 * @param minImpact The minimum impact level to filter by
 * @returns Array of changelog entries with the specified impact level or higher
 */
export function getChangelogByImpact(minImpact: ChangeImpact): ChangelogEntry[] {
  const impactLevels: Record<ChangeImpact, number> = {
    'low': 1,
    'medium': 2,
    'high': 3,
    'critical': 4
  };
  
  const minImpactLevel = impactLevels[minImpact];
  
  return changelog.filter(entry => impactLevels[entry.impact] >= minImpactLevel);
}

/**
 * Format a changelog entry for display
 * @param entry The changelog entry to format
 * @returns Formatted string representation of the changelog entry
 */
export function formatChangelogEntry(entry: ChangelogEntry): string {
  const date = entry.timestamp.toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const time = entry.timestamp.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const impactBadge = {
    'low': '🟢',
    'medium': '🟡',
    'high': '🟠',
    'critical': '🔴'
  }[entry.impact];
  
  const typeBadge = {
    'feature': '✨',
    'improvement': '⚡',
    'bugfix': '🐛',
    'optimization': '🚀',
    'refactor': '♻️',
    'security': '🔒'
  }[entry.type];
  
  return `${impactBadge} ${typeBadge} [${entry.version}] ${date} ${time} - ${entry.description}`;
}

/**
 * Generate a full changelog report
 * @param sortByDate Whether to sort entries by date (default: true)
 * @returns Formatted string containing the full changelog
 */
export function generateChangelogReport(sortByDate = true): string {
  const entries = [...changelog];
  
  if (sortByDate) {
    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  const formattedEntries = entries.map(formatChangelogEntry);
  
  return `# FibroGuardian Pro Changelog\n\n${formattedEntries.join('\n')}`;
}

/**
 * Check if a rollback is possible for a specific version
 * @param version The version to check
 * @returns True if all entries for the version have rollback plans
 */
export function canRollbackVersion(version: string): boolean {
  const versionEntries = getChangelogForVersion(version);
  
  if (versionEntries.length === 0) {
    return false;
  }
  
  return versionEntries.every(entry => !!entry.rollbackPlan);
}

/**
 * Generate a rollback plan for a specific version
 * @param version The version to generate a rollback plan for
 * @returns Formatted string containing the rollback plan
 */
export function generateRollbackPlan(version: string): string {
  const versionEntries = getChangelogForVersion(version);
  
  if (versionEntries.length === 0) {
    return `No entries found for version ${version}`;
  }
  
  if (!canRollbackVersion(version)) {
    return `Cannot generate rollback plan for version ${version} - some entries are missing rollback plans`;
  }
  
  // Sort entries in reverse order of impact
  const sortedEntries = [...versionEntries].sort((a, b) => {
    const impactLevels: Record<ChangeImpact, number> = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'critical': 4
    };
    
    return impactLevels[b.impact] - impactLevels[a.impact];
  });
  
  const rollbackSteps = sortedEntries.map((entry, index) => {
    return `${index + 1}. ${entry.description}\n   - ${entry.rollbackPlan}`;
  });
  
  return `# Rollback Plan for Version ${version}\n\n${rollbackSteps.join('\n\n')}`;
}
