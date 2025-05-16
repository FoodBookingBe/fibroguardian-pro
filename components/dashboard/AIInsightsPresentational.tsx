// components/dashboard/AIInsightsPresentational.tsx
'use client'; // Client component due to interactive elements (expand button)
import React from 'react';
import Link from 'next/link';
import { Inzicht, TaskLog } from '@/types';
import AIInsightVisualization from '@/components/ai/AIInsightVisualization';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { AlertMessage } from '@/components/common/AlertMessage';
import { ErrorMessage } from '@/lib/error-handler';

interface AIInsightsPresentationalProps {
  insights: Inzicht[];
  expandedInsightId: string | null;
  onToggleExpand: (id: string) => void;
  isLoadingLogs: boolean;
  logsForInsight: TaskLog[];
  logsError: ErrorMessage | null; // Error specific to fetching logs for an insight
  limit?: number; // To show "Bekijk alle inzichten" link
}

export default function AIInsightsPresentational({
  insights,
  expandedInsightId,
  onToggleExpand,
  isLoadingLogs,
  logsForInsight,
  logsError,
  limit = 3, // Default limit consistent with container
}: AIInsightsPresentationalProps) {

  const formatDate = (dateString: Date | string) => new Date(dateString).toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const getTrendIcon = (trendType: string | undefined) => {
    switch(trendType?.toLowerCase()) {
      case 'positief': return <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>;
      case 'negatief': return <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" /></svg>;
      case 'stabiel': return <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a1 1 0 01-1 1H3a1 1 0 110-2h14a1 1 0 011 1z" clipRule="evenodd" /></svg>;
      default: return <svg className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">AI-Inzichten</h2>
        <div className="flex items-center text-sm text-purple-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          <span>Gegenereerd door AI</span>
        </div>
      </div>
      
      <div className="space-y-6">
        {insights.map(insight => (
          <div key={insight.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button" onClick={() => onToggleExpand(insight.id)}
              className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset"
              aria-expanded={expandedInsightId === insight.id ? 'true' : 'false'}
              aria-controls={`insight-details-${insight.id}`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1 mr-3">{getTrendIcon(insight.trend_type)}</div>
                <div className="flex-grow">
                  <p className="text-gray-800 font-medium">{insight.beschrijving}</p>
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <span className="mr-3 capitalize">{insight.periode === 'dag' ? 'Dagelijks' : insight.periode === 'week' ? 'Wekelijks' : 'Maandelijks'} inzicht</span>
                    <span>Gegenereerd op {formatDate(insight.created_at)}</span>
                  </div>
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${expandedInsightId === insight.id ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            
            {expandedInsightId === insight.id && (
              <div id={`insight-details-${insight.id}`} className="border-t border-gray-200">
                {isLoadingLogs ? (
                   <div className="p-4"><SkeletonLoader type="list" count={1} /></div>
                ) : logsError ? (
                  <div className="p-4">
                    <AlertMessage type="error" title="Fout bij laden logs" message={logsError.userMessage || "Kon gerelateerde logs niet laden."} />
                  </div>
                ) : logsForInsight && logsForInsight.length > 0 ? (
                  <AIInsightVisualization insight={insight} logs={logsForInsight} />
                ) : (
                  <div className="p-4 text-sm text-gray-500">Geen gerelateerde logs beschikbaar voor dit inzicht.</div>
                )}
              </div>
            )}
          </div>
        ))}
        {insights.length >= limit && (
          <div className="text-center mt-4">
            <Link href="/inzichten" className="text-purple-600 hover:text-purple-800 text-sm font-medium">Bekijk alle inzichten</Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Optimize with React.memo
// export default React.memo(AIInsightsPresentational); 
// Memoization can be added once props comparison logic is clear, especially for logsForInsight
