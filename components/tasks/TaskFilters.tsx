'use client';
import { useState } from 'react';

// Define a callback type for when filters change
type OnFilterChange = (filters: { type?: string; pattern?: string }) => void;

interface TaskFiltersProps {
  onFilterChange?: OnFilterChange; // Make it optional if not always used for direct filtering
}

export default function TaskFilters({ onFilterChange }: TaskFiltersProps) {
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [patternFilter, setPatternFilter] = useState<string>('');

  const handleApplyFilters = () => {
    if (onFilterChange) {
      onFilterChange({
        type: typeFilter || undefined,
        pattern: patternFilter || undefined,
      });
    }
    // If onFilterChange is not provided, this component might just manage state
    // for other components to read, or trigger a router push with query params.
  };

  return (
    <div className="card mb-6">
      <h3 className="text-md font-semibold text-gray-700 mb-3">Filter Taken</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="type-filter" className="form-label">Filter op Type:</label>
          <select
            id="type-filter"
            className="form-input"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Alle Types</option>
            <option value="taak">Taak</option>
            <option value="opdracht">Opdracht</option>
          </select>
        </div>
        <div>
          <label htmlFor="pattern-filter" className="form-label">Filter op Herhaling:</label>
          <select
            id="pattern-filter"
            className="form-input"
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
            className="btn-primary w-full"
            disabled={!onFilterChange} // Disable if no handler is provided
          >
            Filters Toepassen
          </button>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-500">
        Dit is een placeholder. Implementeer daadwerkelijke filterlogica (bijv. via API call of client-side).
      </p>
    </div>
  );
}