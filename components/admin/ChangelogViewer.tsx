'use client';

import React, { useState, useMemo } from 'react';

import { 
  ChangeCategory, 
  ChangeImpact, 
  getChangelogByImpact, 
  getChangelogForVersion,
  changelog
} from '@/utils/changelog';

interface ChangelogViewerProps {
  className?: string;
}

/**
 * Component for viewing and filtering the system changelog
 */
export default function ChangelogViewer({ className = '' }: ChangelogViewerProps): JSX.Element {
  const [filterVersion, setFilterVersion] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<ChangeCategory | ''>('');
  const [filterImpact, setFilterImpact] = useState<ChangeImpact | ''>('');
  const [sortByDate, setSortByDate] = useState<boolean>(true);

  // Get unique versions from changelog
  const versions = useMemo(() => {
    const uniqueVersions = new Set(changelog.map(entry => entry.version));
    return Array.from(uniqueVersions).sort((a, b) => {
      // Sort versions in descending order (newest first)
      return b.localeCompare(a, undefined, { numeric: true });
    });
  }, []);

  // Filter and sort changelog entries
  const filteredEntries = useMemo(() => {
    let result = [...changelog];
    
    // Apply version filter
    if (filterVersion) {
      result = getChangelogForVersion(filterVersion);
    }
    
    // Apply category filter
    if (filterCategory) {
      result = result.filter(entry => entry.category === filterCategory);
    }
    
    // Apply impact filter
    if (filterImpact) {
      result = getChangelogByImpact(filterImpact).filter(entry => 
        result.some(e => 
          e.version === entry.version && 
          e.category === entry.category && 
          e.description === entry.description
        )
      );
    }
    
    // Sort entries
    if (sortByDate) {
      result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } else {
      // Sort by version and then by impact
      result.sort((a, b) => {
        const versionCompare = b.version.localeCompare(a.version, undefined, { numeric: true });
        if (versionCompare !== 0) return versionCompare;
        
        const impactLevels: Record<ChangeImpact, number> = {
          'critical': 4,
          'high': 3,
          'medium': 2,
          'low': 1
        };
        
        return impactLevels[b.impact] - impactLevels[a.impact];
      });
    }
    
    return result;
  }, [filterVersion, filterCategory, filterImpact, sortByDate]);

  // Get impact badge color
  const getImpactColor = (impact: ChangeImpact): string => {
    switch (impact) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get category badge color
  const getCategoryColor = (category: ChangeCategory): string => {
    switch (category) {
      case 'ai':
        return 'bg-purple-100 text-purple-800';
      case 'frontend':
        return 'bg-blue-100 text-blue-800';
      case 'backend':
        return 'bg-indigo-100 text-indigo-800';
      case 'database':
        return 'bg-cyan-100 text-cyan-800';
      case 'security':
        return 'bg-red-100 text-red-800';
      case 'performance':
        return 'bg-green-100 text-green-800';
      case 'ux':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'feature':
        return '✨';
      case 'improvement':
        return '⚡';
      case 'bugfix':
        return '🐛';
      case 'optimization':
        return '🚀';
      case 'refactor':
        return '♻️';
      case 'security':
        return '🔒';
      default:
        return '';
    }
  };

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`${className} rounded-lg bg-white p-6 shadow-md`}>
      <h2 className="mb-6 text-xl font-semibold text-gray-800">Systeem Changelog</h2>
      
      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <label htmlFor="version-filter" className="mb-1 block text-sm font-medium text-gray-700">
            Versie
          </label>
          <select
            id="version-filter"
            value={filterVersion}
            onChange={(e: unknown) => setFilterVersion(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
          >
            <option value="">Alle versies</option>
            {versions.map(version => (
              <option key={version} value={version}>
                {version}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="category-filter" className="mb-1 block text-sm font-medium text-gray-700">
            Categorie
          </label>
          <select
            id="category-filter"
            value={filterCategory}
            onChange={(e: unknown) => setFilterCategory(e.target.value as ChangeCategory | '')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
          >
            <option value="">Alle categorieën</option>
            <option value="ai">AI</option>
            <option value="frontend">Frontend</option>
            <option value="backend">Backend</option>
            <option value="database">Database</option>
            <option value="security">Security</option>
            <option value="performance">Performance</option>
            <option value="ux">UX</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="impact-filter" className="mb-1 block text-sm font-medium text-gray-700">
            Impact
          </label>
          <select
            id="impact-filter"
            value={filterImpact}
            onChange={(e: unknown) => setFilterImpact(e.target.value as ChangeImpact | '')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
          >
            <option value="">Alle impact levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="sort-by" className="mb-1 block text-sm font-medium text-gray-700">
            Sorteren op
          </label>
          <select
            id="sort-by"
            value={sortByDate ? 'date' : 'version'}
            onChange={(e: unknown) => setSortByDate(e.target.value === 'date')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
          >
            <option value="date">Datum</option>
            <option value="version">Versie & Impact</option>
          </select>
        </div>
      </div>
      
      {/* Changelog entries */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <p className="text-center text-gray-500">Geen changelog entries gevonden met de geselecteerde filters.</p>
        ) : (
          filteredEntries.map((entry, index) => (
            <div key={`${entry.version}-${entry.category}-${index}`} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getImpactColor(entry.impact)}`}>
                    {entry.impact.charAt(0).toUpperCase() + entry.impact.slice(1)}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getCategoryColor(entry.category)}`}>
                    {entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                    {getTypeIcon(entry.type)} {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">v{entry.version}</span> - {formatDate(entry.timestamp)}
                </div>
              </div>
              
              <h3 className="mb-2 text-base font-medium text-gray-900">{entry.description}</h3>
              
              {entry.rollbackPlan && (
                <div className="mt-2 text-sm text-gray-700">
                  <span className="font-medium">Rollback plan:</span> {entry.rollbackPlan}
                </div>
              )}
              
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                {entry.author && (
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Auteur:</span> {entry.author}
                  </div>
                )}
                
                {entry.relatedIssues && entry.relatedIssues.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {entry.relatedIssues.map(issue => (
                      <span key={issue} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                        {issue}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
