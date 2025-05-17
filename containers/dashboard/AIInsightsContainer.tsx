// containers/dashboard/AIInsightsContainer.tsx
'use client';
import { useState, useMemo } from 'react'; // Added useMemo
import { useAuth } from '@/components/auth/AuthProvider';
import { useInsights, useRecentLogs, RecentLogWithTaskTitle } from '@/hooks/useSupabaseQuery';
import { ConditionalRender } from '@/components/ui/ConditionalRender';
import { useNotification } from '@/context/NotificationContext';
import AIInsightsPresentational from '@/components/dashboard/AIInsightsPresentational'; // New presentational component
import { Inzicht, TaskLog } from '@/types';
import { ErrorMessage } from '@/lib/error-handler'; 

// Define an EmptyState component or use inline JSX for emptyFallback
const EmptyInsightsState = () => (
  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
    <p className="text-gray-500 mb-2">Nog geen AI-inzichten beschikbaar</p>
    <p className="text-sm text-gray-400">Log meer activiteiten om gepersonaliseerde inzichten te ontvangen</p>
  </div>
);

interface AIInsightsContainerProps {
  initialInsightsProp?: Inzicht[]; // Renamed prop for clarity
  limit?: number;
}

export function AIInsightsContainer({ initialInsightsProp, limit = 3 }: AIInsightsContainerProps) {
  const { user } = useAuth();
  const userId = user?.id;
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);
  const { addNotification } = useNotification();

  // Data fetching for insights
  const { 
    data: insights, 
    isLoading: isLoadingInsights, 
    error: insightsError, 
    isError: isInsightsError 
  } = useInsights(userId, limit);
  
  // Data fetching for logs, enabled only when an insight is expanded
  // Fetch a larger set of recent logs; filtering will happen based on insight period
  const { 
    data: recentLogs, 
    isLoading: isLoadingLogs,
    error: logsError, // Capture error for logs
    isError: isLogsError // Capture isError for logs
  } = useRecentLogs(userId, 50, { // Fetch more logs (e.g., last 50) to cover potential insight periods
    enabled: !!userId && !!expandedInsightId, // Only fetch if user and an insight is expanded
  });
  
  const handleToggleExpand = (id: string) => {
    const newExpandedId = expandedInsightId === id ? null : id;
    setExpandedInsightId(newExpandedId);
    if (newExpandedId && (!recentLogs || recentLogs.length === 0) && !isLoadingLogs) {
      // This notification might be too early if logs are about to be fetched by enabled hook
      // addNotification('info', 'Inzicht details en gerelateerde logs worden geladen...');
    }
  };
  
  // Memoized calculation for logs relevant to the currently expanded insight
  const logsForExpandedInsight = useMemo(() => {
    if (!expandedInsightId || !insights || !recentLogs) return [];
    
    const currentInsight = insights.find(i => i.id === expandedInsightId);
    if (!currentInsight) return [];

    const insightDate = new Date(currentInsight.created_at); // Assuming insight's date is its creation date
    let startDate = new Date(insightDate);

    // Determine the period for the insight
    // This logic should ideally match how insights are generated
    switch (currentInsight.periode) {
      case 'dag':
        startDate.setDate(insightDate.getDate() - 1); // Logs from the day of the insight
        break;
      case 'week':
        startDate.setDate(insightDate.getDate() - 7); // Logs from the week leading up to the insight
        break;
      case 'maand':
        startDate.setMonth(insightDate.getMonth() - 1); // Logs from the month leading up to the insight
        break;
      default:
        startDate.setDate(insightDate.getDate() - 7); // Default to a week
    }
    
    return recentLogs.filter(log => {
      const logDate = new Date(log.start_tijd);
      return logDate >= startDate && logDate <= insightDate; // Filter logs within the period
    });
  }, [expandedInsightId, insights, recentLogs]);
  
  return (
    <ConditionalRender
      isLoading={isLoadingInsights && !insights} // Show loading only if no initial/cached insights
      isError={isInsightsError}
      error={insightsError}
      data={insights}
      skeletonType="card" // Or a more specific 'insights' skeleton
      emptyFallback={<EmptyInsightsState />}
    >
      {(insightsData) => (
        <AIInsightsPresentational
          insights={insightsData}
          expandedInsightId={expandedInsightId}
          onToggleExpand={handleToggleExpand}
          isLoadingLogs={isLoadingLogs && !!expandedInsightId} // Logs are loading only if an insight is expanded
          logsForInsight={logsForExpandedInsight}
          logsError={isLogsError ? (logsError as ErrorMessage) : null} // Pass log specific error
        />
      )}
    </ConditionalRender>
  );
}
