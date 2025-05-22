import React from 'react';

'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Define a callback type for when filters change
type OnFilterChange = (filters: { type?: string; pattern?: string }) => void;

interface TaskFiltersProps {
  onFilterChange?: OnFilterChange; // Make it optional if not always used for direct filtering
}

export default function TaskFilters({ onFilterChange }: TaskFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize state from URL parameters if available
  const [typeFilter, setTypeFilter] = useState<string>(searchParams.get('type') || '');
  const [patternFilter, setPatternFilter] = useState<string>(searchParams.get('pattern') || '');

  // Apply filters when component mounts if URL parameters exist
  useEffect(() => {
    if ((searchParams.get('type') || searchParams.get('pattern')) && onFilterChange) {
      onFilterChange({
        type: searchParams.get('type') || undefined,
        pattern: searchParams.get('pattern') || undefined,
      });
    }
  }, [searchParams, onFilterChange]);

  const handleApplyFilters = () => {
    const currentPathname = window.location.pathname; // Gebruik huidige pathname
    const params = new URLSearchParams(searchParams.toString()); // Start met bestaande params

    if (typeFilter) {
      params.set('type', typeFilter);
    } else {
      params.delete('type'); // Verwijder als leeg
    }

    if (patternFilter) {
      params.set('pattern', patternFilter);
    } else {
      params.delete('pattern'); // Verwijder als leeg
    }
    
    const queryString = params.toString();
    router.push(`${currentPathname}${queryString ? `?${queryString}` : ''}`);
    
    // Call the callback if provided
    if (onFilterChange) {
      onFilterChange({
        type: typeFilter || undefined,
        pattern: patternFilter || undefined,
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-md font-semibold text-gray-700 mb-3">Filter Taken</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter op Type:</label>
          <select
            id="type-filter"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Alle Types</option>
            <option value="taak">Taak</option>
            <option value="opdracht">Opdracht</option>
          </select>
        </div>
        <div>
          <label htmlFor="pattern-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter op Herhaling:</label>
          <select
            id="pattern-filter"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={patternFilter}
            onChange={(e) => setPatternFilter(e.target.value)}
          >
            <option value="">Alle Patronen</option>
            <option value="eenmalig">Eenmalig</option>
            <option value="dagelijks">Dagelijks</option>
            <option value="wekelijks">Wekelijks</option>
            <option value="maandelijks">Maandelijks</option>
            <option value="aangepast">Aangepast</option>
          </select>
        </div>
        <div className="md:self-end">
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors w-full"
          >
            Filters Toepassen
          </button>
        </div>
      </div>
    </div>
  );
}
