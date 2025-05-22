import React from 'react';

// containers/dashboard/DailyPlannerContainer.tsx
'use client';
import { useState, useMemo, useEffect } from 'react'; // Added useEffect
import { useTasks } from '@/hooks/useSupabaseQuery';
import { _useAuth as useAuth } from '@/components/auth/AuthProvider';
import { ConditionalRender } from '@/components/ui/ConditionalRender';
import DailyPlanner from '@/components/dashboard/DailyPlanner';
import { Task, TaskLog } from '@/types'; // TaskLog toegevoegd
import { getSupabaseBrowserClient } from '@/lib/supabase-client'; // Voor logs

// Definieer een interface voor de verrijkte taak
export interface EnrichedTask extends Task {
  status: 'voltooid' | 'openstaand';
  voltooid_op?: string | Date | null;
}

// Define an EmptyState component or use inline JSX for emptyFallback
const EmptyTasksState = () => (
  <div className="bg-white rounded-lg shadow-md p-8 text-center">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
    <h2 className="text-xl font-semibold text-gray-700 mb-2">Geen taken voor vandaag</h2>
    <p className="text-gray-500">Plan uw dag of voeg nieuwe taken toe.</p>
    {/* Link to add task or planning page could be added here */}
  </div>
);


export function DailyPlannerContainer(): JSX.Element {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<string>('all'); // 'all', 'taak', 'opdracht'
  
  // Fetch taken voor de huidige gebruiker
  // Assuming useTasks fetches all tasks; filtering for "today" might need to happen here or in DailyPlanner
  // Or useTasks could accept a date filter. For now, fetching all and filtering client-side.
  const { data: allTasks, isLoading, error, isError } = useTasks(user?.id);
  
  // Filter functie - verplaatst van component naar container
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };
  
  // Gefilterde taken berekenen
  const [enrichedTasks, setEnrichedTasks] = useState<EnrichedTask[]>([]);
  const supabase = getSupabaseBrowserClient(); // Client voor logs

  useEffect(() => {
    const processTasks = async () => {
      if (!allTasks || allTasks.length === 0) {
        setEnrichedTasks([]);
        return;
      }

      const taskIds = allTasks.map(t => t.id);
      let completedTaskIds: Set<string> = new Set();
      let taskLogsMap: Map<string, TaskLog> = new Map();

      if (taskIds.length > 0) {
        const { data: logsData, error: logsError } = await supabase
          .from('task_logs')
          .select('*')
          .in('task_id', taskIds)
          .eq('user_id', user?.id || ''); // Zorg voor user context

        if (logsError) {
          console.warn('Error fetching logs for DailyPlannerContainer:', logsError.message);
        } else if (logsData) {
          logsData.forEach(log => {
            // Bewaar de meest recente log voor elke taak, omdat deze de meest recente feedback bevat.
            // Als er meerdere logs zijn, willen we de log met de meest recente 'created_at' of 'eind_tijd'.
            // Aangezien de logs al gesorteerd zijn op 'created_at' (als dat de default is),
            // de laatste log in de array voor een bepaalde task_id is de meest recente.
            // Echter, de query in useTasks haalt logs op met order('created_at', { ascending: false }),
            // dus de eerste log in logsData voor een task_id is de meest recente.
            // We moeten ervoor zorgen dat taskLogsMap de meest recente log opslaat.
            // De huidige logica: `if (!taskLogsMap.has(log.task_id) || (log.eind_tijd && !taskLogsMap.get(log.task_id)?.eind_tijd))`
            // is bedoeld om de log met een eind_tijd te prioriteren, maar niet per se de meest recente feedback.
            // Laten we de meest recente log (op basis van created_at) opslaan, die ook de feedback bevat.
            // De logsData is al gesorteerd op created_at DESC, dus de eerste log voor een task_id is de meest recente.
            if (!taskLogsMap.has(log.task_id)) {
              taskLogsMap.set(log.task_id, log as TaskLog);
            }
            // Als er een eind_tijd is, markeer de taak als voltooid
            if (log.eind_tijd) {
              completedTaskIds.add(log.task_id);
            }
          });
        }
      }
      
      const processed = allTasks.map(task => {
        const status: 'voltooid' | 'openstaand' = completedTaskIds.has(task.id) ? 'voltooid' : 'openstaand';
        const relevantLog = taskLogsMap.get(task.id);
        return {
          ...task,
          status,
          voltooid_op: status === 'voltooid' ? relevantLog?.eind_tijd : null,
          // Voeg feedback toe aan de verrijkte taak
          feedback: relevantLog ? {
            pijn_score: relevantLog.pijn_score,
            vermoeidheid_score: relevantLog.vermoeidheid_score,
            energie_voor: relevantLog.energie_voor,
            energie_na: relevantLog.energie_na,
            stemming: relevantLog.stemming,
            hartslag: relevantLog.hartslag,
            notitie: relevantLog.notitie,
          } : undefined,
        };
      });
      setEnrichedTasks(processed as EnrichedTask[]);
    };

    processTasks();
  }, [allTasks, user?.id, supabase]);
  
  const filteredTasks = useMemo(() => {
    if (!enrichedTasks) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Begin van de dag

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Begin van de volgende dag

    return enrichedTasks.filter(task => {
      // Een taak is relevant voor vandaag als:
      // 1. Het een openstaande taak is (status 'openstaand').
      // 2. Het een voltooide taak is die vandaag is voltooid.
      // 3. Het een herhalende taak is die vandaag actief is (op basis van dagen_van_week en herhaal_patroon).
      // 4. Het een eenmalige taak is die vandaag is aangemaakt.

      const currentDayOfWeek = today.getDay().toString(); // 0 = Zondag, 1 = Maandag, etc.

      let isRelevant = false;

      // Conditie 1: Openstaande taken
      if (task.status === 'openstaand') {
        isRelevant = true;
      }

      // Conditie 2: Voltooide taken die vandaag zijn voltooid
      if (task.status === 'voltooid' && task.voltooid_op) {
        const voltooidOpDate = new Date(task.voltooid_op);
        if (voltooidOpDate >= today && voltooidOpDate < tomorrow) {
          isRelevant = true;
        }
      }

      // Conditie 3: Herhalende taken die vandaag actief zijn
      if (task.herhaal_patroon !== 'eenmalig' && task.dagen_van_week && task.dagen_van_week.includes(currentDayOfWeek)) {
        // Voor herhalende taken, als ze vandaag actief zijn, zijn ze relevant
        isRelevant = true;
      }

      // Conditie 4: Eenmalige taken die vandaag zijn aangemaakt (als ze nog niet voltooid zijn)
      if (task.herhaal_patroon === 'eenmalig' && task.status === 'openstaand') {
        const createdAtDate = new Date(task.created_at);
        if (createdAtDate >= today && createdAtDate < tomorrow) {
          isRelevant = true;
        }
      }

      if (!isRelevant) return false;

      // Filteren op type (taak/opdracht)
      if (activeFilter === 'all') return true;
      return task.type === activeFilter;
    });
  }, [enrichedTasks, activeFilter]);
  
  return (
    <ConditionalRender
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={allTasks} // Pass allTasks to ensure ConditionalRender doesn't show empty if filteredTasks is empty but allTasks is not
      skeletonType="tasks" // Or a more specific "planner" skeleton
      emptyFallback={<EmptyTasksState />} // This shows if allTasks is empty
    >
      {() => ( 
        <DailyPlanner 
          tasks={filteredTasks} // Pass the enriched and filtered tasks
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          userId={user?.id || ''} 
        />
      )}
    </ConditionalRender>
  );
}
