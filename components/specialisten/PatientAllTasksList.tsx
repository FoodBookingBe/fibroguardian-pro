import React from 'react';

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation'; // Importeer useSearchParams
import { TaskLog, Task as TaskType } from '@/types';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import TaskItemCard, { TaskWithStatusAndFeedbackForCard } from '@/components/tasks/TaskItemCard';
import TaskFilters from '@/components/tasks/TaskFilters'; // Importeer TaskFilters
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Task } from '@/types';

// Definieer GroupedTasks interface (kan later naar een gedeeld types bestand)
export interface GroupedTasksSpecialist {
  pattern: Task['herhaal_patroon'];
  title: string;
  tasks: TaskWithStatusAndFeedbackForCard[];
}

interface PatientAllTasksListProps {
  patientId: string;
  specialistId: string;
}

export default function PatientAllTasksList({ patientId, specialistId }: PatientAllTasksListProps) {
  const [tasksWithDetails, setTasksWithDetails] = useState<TaskWithStatusAndFeedbackForCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const supabase = getSupabaseBrowserClient();
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get('type');
  const patternFilter = searchParams.get('pattern');

  // Groepeer en filter taken
  const groupedAndFilteredTasks = useMemo(() => {
    if (!tasksWithDetails || tasksWithDetails.length === 0) return [];

    let filteredByPattern = tasksWithDetails;
    if (patternFilter) {
      filteredByPattern = tasksWithDetails.filter(task => task.herhaal_patroon === patternFilter);
    }

    const groups: Record<Task['herhaal_patroon'], TaskWithStatusAndFeedbackForCard[]> = {
      eenmalig: [],
      dagelijks: [],
      wekelijks: [],
      maandelijks: [],
      aangepast: [],
    };

    filteredByPattern.forEach(task => {
      // Alleen toevoegen als het type overeenkomt met typeFilter (indien aanwezig)
      if (!typeFilter || task.type === typeFilter) {
        groups[task.herhaal_patroon].push(task);
      }
    });

    const patternOrder: Task['herhaal_patroon'][] = ['dagelijks', 'wekelijks', 'maandelijks', 'eenmalig', 'aangepast'];
    
    return patternOrder
      .map(pattern => ({
        pattern,
        title: `${pattern.charAt(0).toUpperCase() + pattern.slice(1)}e Taken`,
        tasks: groups[pattern],
      }))
      .filter(group => group.tasks.length > 0);
  }, [tasksWithDetails, typeFilter, patternFilter]);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (!patientId || !specialistId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);

      try {
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', patientId) // Moet altijd voor deze patiënt zijn
          .or(`specialist_id.eq.${specialistId},specialist_id.is.null`) // Taak is van deze specialist OF door patiënt zelf aangemaakt
          .order('created_at', { ascending: false });

        if (tasksError) throw tasksError;

        if (!tasksData || tasksData.length === 0) {
          setTasksWithDetails([]);
          return; 
        }

        const taskIds = tasksData.map(t => t.id);
        let allLogsForTasks: TaskLog[] = [];
        let completedTaskIds: Set<string> = new Set();

        const { data: allLogsData, error: allLogsError } = await supabase
          .from('task_logs')
          .select('*')
          .in('task_id', taskIds)
          .eq('user_id', patientId)
          .order('created_at', { ascending: false });

        if (allLogsError) {
          console.warn(`Error fetching all_logs for PatientAllTasksList (patient: ${patientId}): ${allLogsError.message}`);
        }
        if (allLogsData) {
          allLogsForTasks = allLogsData as TaskLog[];
          completedTaskIds = new Set(
            allLogsForTasks
              .filter(log => log.eind_tijd !== null && log.eind_tijd !== undefined)
              .map(log => log.task_id)
          );
        }

        const processedTasks = tasksData.map(task => {
          const status: 'voltooid' | 'openstaand' = completedTaskIds.has(task.id) ? 'voltooid' : 'openstaand';
          const taskLog = allLogsForTasks.find(log => log.task_id === task.id);
          const completionLog = allLogsForTasks.find(log => log.task_id === task.id && log.eind_tijd);
          const voltooidOpDatum = status === 'voltooid' ? completionLog?.eind_tijd : null;

          return {
            ...task,
            status,
            voltooid_op: voltooidOpDatum, 
            feedback: taskLog ? {
              pijn_score: taskLog.pijn_score,
              vermoeidheid_score: taskLog.vermoeidheid_score,
              energie_voor: taskLog.energie_voor,
              energie_na: taskLog.energie_na,
              stemming: taskLog.stemming,
              notitie: taskLog.notitie,
            } : undefined,
          };
        });
        setTasksWithDetails(processedTasks as TaskWithStatusAndFeedbackForCard[]);

      } catch (e: unknown) { // ESLint zal hier nog steeds klagen, maar functioneel ok voor nu
        console.error(`Error fetching all task details for patient ${patientId}:`, e);
        setError(e.message || 'Kon taakdetails niet laden.');
      } finally {
        setIsLoading(false);
      }
    }; 

    fetchTaskDetails(); 
  }, [patientId, specialistId, supabase, refreshKey]); 

  if (isLoading) {
    return <SkeletonLoader type="list" count={5} className="h-20 mb-3" />;
  }

  if (error) {
    return <p className="text-red-500">Fout bij het laden van taken: {error}</p>;
  }

  // De empty state wordt nu beter afgehandeld door de combinatie van groupedAndFilteredTasks en de map
  // if (!groupedAndFilteredTasks || groupedAndFilteredTasks.length === 0) { 
  //   return <p className="text-gray-500">Er zijn nog geen taken toegewezen aan deze patiënt door u, of geen die voldoen aan de filters.</p>;
  // }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <TaskFilters /> {/* Filters toegevoegd */}
        <button
          onClick={() => setRefreshKey(prev => prev + 1)}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 disabled:opacity-50"
        >
          {isLoading ? 'Laden...' : 'Ververs Taken'}
        </button>
      </div>
      
      {groupedAndFilteredTasks.length > 0 ? (
        <div className="space-y-10"> 
          {groupedAndFilteredTasks.map((group: GroupedTasksSpecialist) => ( 
            <section key={group.pattern} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-purple-700 mb-3 border-b border-gray-200 pb-2">
                {group.title}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({group.tasks.length} {group.tasks.length === 1 ? 'item' : 'items'})
                </span>
              </h3>
              {/* Deze check is dubbelop, want groupedAndFilteredTasks bevat al alleen groepen met taken, 
                  en binnen de map-logica filteren we ook nog. Maar het is niet schadelijk. */}
              {group.tasks.length > 0 ? ( 
                <ul className="space-y-4">
                  {group.tasks.map((task: TaskWithStatusAndFeedbackForCard) => ( 
                    <TaskItemCard 
                      key={task.id} 
                      task={task} 
                    />
                  ))}
                </ul>
              ) : (
                // Deze P zou idealiter niet bereikt moeten worden als de filterlogica in useMemo correct is
                <p className="text-sm text-gray-500 italic">Geen {group.pattern}e taken die voldoen aan de filters.</p> 
              )}
            </section>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 py-4 text-center">Geen taken gevonden die voldoen aan de huidige filters.</p>
      )}
    </div>
  );
}
