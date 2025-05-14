'use client';
import { Inzicht } from '@/types';

interface AIInsightsProps {
  insights: Inzicht[];
}

export default function AIInsights({ insights }: AIInsightsProps) {
  // Helper voor het formatteren van datum
  const formatDate = (dateString: Date | string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-BE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Helper voor het bepalen van trend icon
  const getTrendIcon = (trendType: string | undefined) => {
    switch(trendType?.toLowerCase()) { // Added toLowerCase for case-insensitivity
      case 'positief':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
          </svg>
        );
      case 'negatief':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
          </svg>
        );
      case 'stabiel':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a1 1 0 01-1 1H3a1 1 0 110-2h14a1 1 0 011 1z" clipRule="evenodd" />
          </svg>
        );
      default: // For 'algemeen' or undefined
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">AI-Inzichten</h2> {/* Adjusted text color */}
        
        <div className="flex items-center text-sm text-purple-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Gegenereerd door AI</span>
        </div>
      </div>
      
      {insights && insights.length > 0 ? (
        <div className="space-y-4">
          {insights.map(insight => (
            <div key={insight.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"> {/* Added hover effect and adjusted border */}
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">
                  {getTrendIcon(insight.trend_type)}
                </div>
                <div className="flex-grow">
                  <p className="text-gray-800 font-medium">{insight.beschrijving}</p> {/* Made description slightly bolder */}
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <span className="mr-3 capitalize"> {/* Capitalize periode */}
                      {insight.periode === 'dag' ? 'Dagelijks inzicht' : 
                       insight.periode === 'week' ? 'Wekelijks inzicht' : 'Maandelijks inzicht'}
                    </span>
                    <span>Gegenereerd op {formatDate(insight.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-gray-500 mb-2">Nog geen AI-inzichten beschikbaar</p>
          <p className="text-sm text-gray-400">Log meer activiteiten om gepersonaliseerde inzichten te ontvangen</p>
        </div>
      )}
    </div>
  );
}