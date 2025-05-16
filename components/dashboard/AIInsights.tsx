'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useInsights, useRecentLogs, RecentLogWithTaskTitle } from '@/hooks/useSupabaseQuery'; // Import useInsights
import { Inzicht, TaskLog } from '@/types';
import AIInsightVisualization from '@/components/ai/AIInsightVisualization';
import Link from 'next/link';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'; 
import { AlertMessage } from '@/components/common/AlertMessage';
import { ErrorMessage } from '@/lib/error-handler';
import { getSupabaseBrowserClient } from '@/lib/supabase'; 
import { ConditionalRender } from '@/components/ui/ConditionalRender'; // Import ConditionalRender

interface AIInsightsProps {
  insights?: Inzicht[]; // For SSR or parent-passed initial data
  limit?: number;
}

export default function AIInsights({ insights: initialInsightsProp, limit = 3 }: AIInsightsProps) {
  const { user } = useAuth();
  const userId = user?.id;

  const { 
    data: fetchedInsights, 
    isLoading: isLoadingInsights, 
    error: insightsError, 
    isError: isInsightsError 
  } = useInsights(userId, limit, { 
    enabled: !!userId && !initialInsightsProp, // Fetch only if no initialInsights and user is available
    initialData: initialInsightsProp,
  });
  
  // Use fetchedInsights if available, otherwise initialInsightsProp if hook is disabled or still loading initialData
  const insightsToDisplay = fetchedInsights || initialInsightsProp || [];

  // State for logs fetched for an expanded insight
  const [logsByInsightId, setLogsByInsightId] = useState<Record<string, TaskLog[]>>({});
  const [loadingLogsForInsight, setLoadingLogsForInsight] = useState<string | null>(null);
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);
  
  // Fetch logs for a specific insight when expanded - this part still uses direct client
  // TODO: Consider refactoring this log fetching into its own hook if complex/reused
  useEffect(() => {
    const fetchLogsForInsight = async (insightId: string) => {
      if (logsByInsightId[insightId] || !userId) return; // Already fetched or no user
      
      setLoadingLogsForInsight(insightId);
      try {
        const insight = insightsToDisplay.find(i => i.id === insightId);
        if (!insight) {
          setLoadingLogsForInsight(null);
          return;
        }
        
        const supabaseClient = getSupabaseBrowserClient(); // Direct client for this specific fetch
        const endDate = new Date();
        let startDate = new Date();
        if (insight.periode === 'dag') startDate.setDate(endDate.getDate() - 7);
        else if (insight.periode === 'week') startDate.setDate(endDate.getDate() - 30);
        else if (insight.periode === 'maand') startDate.setMonth(endDate.getMonth() - 3);
        
        const { data, error: fetchError } = await supabaseClient
          .from('task_logs')
          .select('*') // Fetches all columns from task_logs
          .eq('user_id', userId)
          .gte('start_tijd', startDate.toISOString())
          .lte('start_tijd', endDate.toISOString())
          .order('start_tijd', { ascending: true });
        
        if (fetchError) throw fetchError;
        
        setLogsByInsightId(prevLogs => ({ ...prevLogs, [insightId]: data || [] }));
      } catch (error: any) {
        console.error('Fout bij ophalen logs voor inzicht:', error);
        // Optionally set an error state for this specific log fetch
      } finally {
        setLoadingLogsForInsight(null);
      }
    };
    
    if (expandedInsightId) {
      fetchLogsForInsight(expandedInsightId);
    }
  }, [expandedInsightId, insightsToDisplay, userId, logsByInsightId]);

  const toggleExpand = (id: string) => {
    setExpandedInsightId(prevId => (prevId === id ? null : id));
  };
  
  const formatDate = (dateString: Date | string) => new Date(dateString).toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const getTrendIcon = (trendType: string | undefined) => {
    // Same as before
    switch(trendType?.toLowerCase()) {
      case 'positief': return <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>;
      case 'negatief': return <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" /></svg>;
      case 'stabiel': return <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a1 1 0 01-1 1H3a1 1 0 110-2h14a1 1 0 011 1z" clipRule="evenodd" /></svg>;
      default: return <svg className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
    }
  };
  
  const emptyInsightsFallback = (
    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
      <p className="text-gray-500 mb-2">Nog geen AI-inzichten beschikbaar</p>
      <p className="text-sm text-gray-400">Log meer activiteiten om gepersonaliseerde inzichten te ontvangen</p>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">AI-Inzichten</h2>
        <div className="flex items-center text-sm text-purple-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          <span>Gegenereerd door AI</span>
        </div>
      </div>
      
      <ConditionalRender
        isLoading={isLoadingInsights}
        isError={isInsightsError}
        error={insightsError}
        data={insightsToDisplay}
        skeletonType="card" // Or a more specific 'insights' skeleton if defined
        emptyFallback={emptyInsightsFallback}
      >
        {(currentInsights) => (
          <div className="space-y-6">
            {currentInsights.map(insight => (
              <div key={insight.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button" onClick={() => toggleExpand(insight.id)}
                  className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset"
                  aria-expanded={expandedInsightId === insight.id ? 'true' : 'false'} // Corrected ARIA
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
                    {loadingLogsForInsight === insight.id ? (
                       <div className="p-4"><SkeletonLoader type="list" count={1} /></div>
                    ) : logsByInsightId[insight.id] ? (
                      <AIInsightVisualization insight={insight} logs={logsByInsightId[insight.id]} />
                    ) : (
                      <div className="p-4 text-sm text-gray-500">Kon logs niet laden of geen logs beschikbaar voor deze periode.</div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {currentInsights.length >= limit && (
              <div className="text-center mt-4">
                <Link href="/inzichten" className="text-purple-600 hover:text-purple-800 text-sm font-medium">Bekijk alle inzichten</Link>
              </div>
            )}
          </div>
        )}
      </ConditionalRender>
    </div>
  );
}
