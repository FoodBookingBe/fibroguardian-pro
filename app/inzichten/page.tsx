'use client';

import AIInsightVisualization from '@/components/ai/AIInsightVisualization';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { Inzicht, TaskLog } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function InzichtenPage(): JSX.Element {
  const router = useRouter();
  const [insights, setInsights] = useState<Inzicht[]>([]);
  const [logs, setLogs] = useState<Record<string, TaskLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'dag' | 'week' | 'maand'>('all');

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabaseClient = getSupabaseBrowserClient();
      const { data: { user } } = await supabaseClient.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      let query = supabaseClient
        .from('inzichten')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('periode', filter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setInsights(data || []);
    } catch (error: unknown) {
      console.error('Fout bij ophalen inzichten:', error);
      setError((error as any).message || 'Er is een fout opgetreden bij het ophalen van de inzichten');
    } finally {
      setLoading(false);
    }
  }, [router, filter]);

  useEffect(() => {
    fetchInsights();
    return undefined; // Add default return
  }, [fetchInsights]);

  // Fetch logs for a specific insight when expanded
  useEffect(() => {
    const fetchLogsForInsight = async (insightId: string) => {
      // Skip if we already have logs for this insight
      if (logs[insightId]) return;

      try {
        const insight = insights.find(i => i.id === insightId);
        if (!insight) return;

        const supabaseClient = getSupabaseBrowserClient();
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) return;

        // Determine date range based on insight period
        const endDate = new Date();
        let startDate = new Date();

        if (insight.periode === 'dag') {
          startDate.setDate(startDate.getDate() - 7); // Last week for daily insights
        } else if (insight.periode === 'week') {
          startDate.setDate(startDate.getDate() - 30); // Last month for weekly insights
        } else if (insight.periode === 'maand') {
          startDate.setDate(startDate.getDate() - 90); // Last 3 months for monthly insights
        }

        const { data, error: fetchError } = await supabaseClient
          .from('task_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('start_tijd', startDate.toISOString())
          .lte('start_tijd', endDate.toISOString())
          .order('start_tijd', { ascending: true });

        if (fetchError) throw fetchError;

        setLogs(prevLogs => ({
          ...prevLogs,
          [insightId]: data || []
        }));
      } catch (error: unknown) {
        console.error('Fout bij ophalen logs voor inzicht:', error);
      }
    };

    if (expandedInsightId) {
      fetchLogsForInsight(expandedInsightId);
    }
  }, [expandedInsightId, insights, logs]);

  // Toggle expanded insight
  const toggleExpand = (id: string) => {
    setExpandedInsightId(prevId => (prevId === id ? null : id));
  };

  // Format date for display
  const formatDate = (dateString: Date | string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-BE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Helper for trend icon
  const getTrendIcon = (trendType: string | undefined) => {
    switch (trendType?.toLowerCase()) {
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">AI-Inzichten</h1>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-sm ${filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Alle inzichten
          </button>
          <button
            onClick={() => setFilter('dag')}
            className={`px-3 py-1 rounded-md text-sm ${filter === 'dag'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Dagelijks
          </button>
          <button
            onClick={() => setFilter('week')}
            className={`px-3 py-1 rounded-md text-sm ${filter === 'week'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Wekelijks
          </button>
          <button
            onClick={() => setFilter('maand')}
            className={`px-3 py-1 rounded-md text-sm ${filter === 'maand'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Maandelijks
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Over AI-Inzichten</h2>
          <p className="text-gray-700">
            AI-inzichten analyseren uw activiteiten en gezondheidsgegevens om patronen te identificeren die u kunnen helpen uw dagelijkse activiteiten beter te beheren.
            Deze inzichten worden automatisch gegenereerd op basis van de gegevens die u invoert bij het uitvoeren van taken.
          </p>
          <p className="text-gray-700 mt-2">
            Hoe meer activiteiten u logt, hoe nauwkeuriger en persoonlijker de inzichten worden.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p>{error}</p>
            <button
              onClick={fetchInsights}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
              Probeer opnieuw
            </button>
          </div>
        </div>
      )}

      {insights.length > 0 ? (
        <div className="space-y-6">
          {insights.map(insight => (
            <div key={insight.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                type="button"
                onClick={() => toggleExpand(insight.id)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset"
                aria-expanded={expandedInsightId === insight.id}
                aria-controls={`insight-details-${insight.id}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3">
                    {getTrendIcon(insight.trend_type)}
                  </div>
                  <div className="flex-grow">
                    <p className="text-gray-800 font-medium">{insight.beschrijving}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <span className="mr-3 capitalize">
                        {insight.periode === 'dag' ? 'Dagelijks inzicht' :
                          insight.periode === 'week' ? 'Wekelijks inzicht' : 'Maandelijks inzicht'}
                      </span>
                      <span>Gegenereerd op {formatDate(insight.created_at)}</span>
                    </div>
                  </div>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${expandedInsightId === insight.id ? 'transform rotate-180' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {expandedInsightId === insight.id && (
                <div
                  id={`insight-details-${insight.id}`}
                  className="border-t border-gray-200"
                >
                  {logs[insight.id] ? (
                    <AIInsightVisualization insight={insight} logs={logs[insight.id]} />
                  ) : (
                    <div className="p-4 text-center">
                      <div className="animate-pulse">
                        <div className="h-32 bg-gray-200 rounded-md"></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Geen inzichten gevonden</h2>
          <p className="text-gray-500 mb-6">
            {filter === 'all'
              ? 'Er zijn nog geen AI-inzichten beschikbaar.'
              : `Er zijn nog geen ${filter === 'dag' ? 'dagelijkse' : filter === 'week' ? 'wekelijkse' : 'maandelijkse'} inzichten beschikbaar.`}
          </p>
          <Link
            href="/taken"
            className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
          >
            Ga naar taken
          </Link>
        </div>
      )}
    </div>
  );
}
