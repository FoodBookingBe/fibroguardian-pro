'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Reflectie } from '@/types';

interface ReflectiesListProps {
  reflecties: Reflectie[];
}

export default function ReflectiesList({ reflecties }: ReflectiesListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Helper om datum te formatteren
  const formatDate = (dateString: Date | string | undefined) => {
    if (!dateString) return 'Onbekende datum';
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-BE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Helper om stemming te visualiseren
  const getStemmingBadge = (stemming?: string) => {
    if (!stemming) return null;
    
    const stemmingLower = stemming.toLowerCase();
    let style = { bg: 'bg-gray-200', text: 'text-gray-700' }; // Default

    if (stemmingLower.includes('zeer goed')) style = { bg: 'bg-green-500', text: 'text-white' };
    else if (stemmingLower.includes('goed')) style = { bg: 'bg-green-400', text: 'text-white' };
    else if (stemmingLower.includes('neutraal')) style = { bg: 'bg-blue-400', text: 'text-white' };
    else if (stemmingLower.includes('matig')) style = { bg: 'bg-yellow-400', text: 'text-black' }; // Contrast
    else if (stemmingLower.includes('slecht') && !stemmingLower.includes('zeer slecht')) style = { bg: 'bg-orange-500', text: 'text-white' };
    else if (stemmingLower.includes('zeer slecht')) style = { bg: 'bg-red-500', text: 'text-white' };
    
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {stemming.charAt(0).toUpperCase() + stemming.slice(1)}
      </span>
    );
  };
  
  // Toggle reflectie detail weergave
  const toggleExpand = (id: string) => {
    setExpandedId(prevId => (prevId === id ? null : id));
  };
  
  if (!reflecties || reflecties.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center"> {/* Increased padding */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"> {/* Adjusted icon style */}
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Geen reflecties gevonden</h2>
        <p className="text-gray-500 mb-6">Deel uw dagelijkse ervaringen en houd bij hoe u zich voelt.</p>
        <Link 
          href="/reflecties/nieuw" 
          className="btn-primary inline-flex items-center" // Used global style
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Eerste Reflectie Toevoegen
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-3"> {/* Adjusted spacing */}
      {reflecties.map(reflectie => (
        <div 
          key={reflectie.id} 
          className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ease-in-out"
        >
          <button // Changed div to button for better accessibility
            type="button"
            className="w-full p-4 hover:bg-gray-50 flex justify-between items-center text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 rounded-t-lg"
            onClick={() => toggleExpand(reflectie.id)}
            aria-expanded={expandedId === reflectie.id ? "true" : "false"}
            aria-controls={`reflectie-details-${reflectie.id}`}
          >
            <div className="flex items-center space-x-3">
              <div className="font-medium text-gray-800">{formatDate(reflectie.datum)}</div>
              {getStemmingBadge(reflectie.stemming)}
            </div>
            <span className="text-gray-500" aria-hidden="true">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 transition-transform duration-200 ${expandedId === reflectie.id ? 'transform rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          
          {expandedId === reflectie.id && (
            <div id={`reflectie-details-${reflectie.id}`} className="px-4 pb-4 pt-3 border-t border-gray-200 bg-gray-50"> {/* Added bg-gray-50 */}
              {reflectie.notitie ? (
                <div className="mb-3 text-sm text-gray-700 whitespace-pre-wrap break-words">{reflectie.notitie}</div>
              ) : (
                <div className="mb-3 text-sm text-gray-500 italic">Geen notitie toegevoegd.</div>
              )}
              
              {reflectie.ai_validatie && (
                <div className="bg-purple-50 border border-purple-200 p-3 rounded-md mb-3 text-sm">
                  <div className="flex items-center text-purple-700 mb-1 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>AI Inzicht</span>
                  </div>
                  <p className="text-purple-800">{reflectie.ai_validatie}</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 mt-2">
                <Link
                  href={`/reflecties/${reflectie.id}/bewerken`} // Assuming an edit route
                  className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  Bewerken
                </Link>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}