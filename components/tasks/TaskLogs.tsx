'use client';
import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { TaskLog, Task } from '@/types';
import Link from 'next/link';

interface TaskLogsProps {
  userId?: string; // Optional: if provided, show logs for a specific user
  taskId?: string; // Optional: if provided, show logs for a specific task
  limit?: number; // Optional: limit the number of logs to show
  showTaskDetails?: boolean; // Optional: show task details
  className?: string; // Optional: additional CSS classes
}

export default function TaskLogs({ 
  userId, 
  taskId, 
  limit = 10, 
  showTaskDetails = true,
  className = ''
}: TaskLogsProps) {
  const [logs, setLogs] = useState<(TaskLog & { task?: Task })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const supabaseClient = getSupabaseBrowserClient();
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
          throw new Error('Niet ingelogd');
        }
        
        // Determine which user's logs to fetch
        const targetUserId = userId || user.id;
        
        // Build the query
        let query = supabaseClient
          .from('task_logs')
          .select('*, tasks(*)')
          .eq('user_id', targetUserId)
          .order('start_tijd', { ascending: false })
          .limit(limit);
        
        // Add task filter if provided
        if (taskId) {
          query = query.eq('task_id', taskId);
        }
        
        const { data, error: fetchError } = await query;
        
        if (fetchError) throw fetchError;
        
        // Transform the data to include task details
        const transformedLogs = data?.map(log => {
          const { tasks, ...logData } = log;
          return {
            ...logData,
            task: tasks as Task
          };
        }) || [];
        
        setLogs(transformedLogs);
      } catch (error: any) {
        console.error('Fout bij ophalen logs:', error);
        setError(error.message || 'Er is een fout opgetreden bij het ophalen van de logs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, [userId, taskId, limit]);
  
  // Format date for display
  const formatDate = (dateString: Date | string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-BE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calculate duration between start and end time
  const calculateDuration = (startTime?: Date | string, endTime?: Date | string) => {
    if (!startTime || !endTime) return 'Onbekend';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    
    // Format as HH:MM:SS
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Toggle expanded log
  const toggleExpand = (id: string) => {
    setExpandedLogId(prevId => (prevId === id ? null : id));
  };
  
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h2 className="text-lg font-semibold mb-4">Activiteiten Logs</h2>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-16 rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h2 className="text-lg font-semibold mb-4">Activiteiten Logs</h2>
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      </div>
    );
  }
  
  if (logs.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h2 className="text-lg font-semibold mb-4">Activiteiten Logs</h2>
        <div className="p-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500">Geen activiteiten logs gevonden</p>
          {!taskId && (
            <Link 
              href="/taken" 
              className="mt-2 inline-block text-purple-600 hover:text-purple-800"
            >
              Ga naar taken
            </Link>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-lg font-semibold mb-4">Activiteiten Logs</h2>
      
      <div className="space-y-3">
        {logs.map(log => (
          <div 
            key={log.id} 
            className="border rounded-lg overflow-hidden transition-all duration-200"
          >
            <button
              type="button"
              onClick={() => toggleExpand(log.id)}
              className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset"
              aria-expanded={expandedLogId === log.id ? 'true' : 'false'}
              aria-controls={`log-details-${log.id}`}
            >
              <div>
                <h3 className="font-medium text-gray-900">
                  {log.task?.titel || 'Onbekende taak'}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatDate(log.start_tijd)}
                  {log.eind_tijd && ` - ${formatDate(log.eind_tijd)}`}
                </p>
              </div>
              <div className="flex items-center">
                {log.eind_tijd ? (
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded-full mr-2">
                    Voltooid
                  </span>
                ) : (
                  <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full mr-2">
                    Actief
                  </span>
                )}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${expandedLogId === log.id ? 'transform rotate-180' : ''}`} 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </button>
            
            {expandedLogId === log.id && (
              <div 
                id={`log-details-${log.id}`}
                className="px-4 py-3 border-t border-gray-200 bg-gray-50"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Taak Details</h4>
                    {showTaskDetails && log.task && (
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Type:</span> {log.task.type === 'taak' ? 'Taak' : 'Opdracht'}
                        </p>
                        {log.task.duur && (
                          <p className="text-sm">
                            <span className="font-medium">Geplande duur:</span> {log.task.duur} minuten
                          </p>
                        )}
                        <p className="text-sm">
                          <span className="font-medium">Werkelijke duur:</span> {log.eind_tijd ? calculateDuration(log.start_tijd, log.eind_tijd) : 'Nog bezig'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Metingen</h4>
                    <div className="space-y-1">
                      {log.energie_voor !== null && (
                        <p className="text-sm">
                          <span className="font-medium">Energie voor:</span> {log.energie_voor}/20
                        </p>
                      )}
                      {log.energie_na !== null && (
                        <p className="text-sm">
                          <span className="font-medium">Energie na:</span> {log.energie_na}/20
                        </p>
                      )}
                      {log.pijn_score !== null && (
                        <p className="text-sm">
                          <span className="font-medium">Pijn:</span> {log.pijn_score}/20
                        </p>
                      )}
                      {log.vermoeidheid_score !== null && (
                        <p className="text-sm">
                          <span className="font-medium">Vermoeidheid:</span> {log.vermoeidheid_score}/20
                        </p>
                      )}
                      {log.stemming && (
                        <p className="text-sm">
                          <span className="font-medium">Stemming:</span> {log.stemming}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {log.notitie && (
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Notitie</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{log.notitie}</p>
                  </div>
                )}
                
                {log.ai_validatie && (
                  <div className="bg-purple-50 border border-purple-200 p-3 rounded-md">
                    <div className="flex items-center text-purple-700 mb-1 text-sm font-medium">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span>AI Inzicht</span>
                    </div>
                    <p className="text-sm text-purple-800">{log.ai_validatie}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {logs.length >= limit && (
        <div className="mt-4 text-center">
          <Link 
            href={taskId ? `/taken/${taskId}/logs` : "/taken/logs"}
            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
          >
            Bekijk alle logs
          </Link>
        </div>
      )}
    </div>
  );
}
