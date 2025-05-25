'use client';

// Fix voor ontbrekende property 'addNotification' op Element type
declare module "react" {
  interface Element {
    addNotification?: unknown;
  }
}
import React from 'react';

import { _useAuth as useAuth } from '@/components/auth/AuthProvider';
import AddTaskButton from '@/components/tasks/AddTaskButton';
import TaskFilters from '@/components/tasks/TaskFilters';
import TaskList from '@/components/tasks/TaskList';
import { ConditionalRender } from '@/components/ui/ConditionalRender';
import { useNotification } from '@/context/NotificationContext'; // Importeer useNotification
import { useDeleteTask } from '@/hooks/useMutations'; // Importeer useDeleteTask
import { useTasks } from '@/hooks/useSupabaseQuery';
import { ErrorMessage } from '@/lib/error-handler'; // Voor typing error
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { Task, TaskLog } from '@/types'; // TaskLog toegevoegd
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

// Hergebruik EnrichedTask interface
export interface EnrichedTask extends Task {
  status: 'voltooid' | 'openstaand';
  voltooid_op?: string | Date | null;
}

export interface GroupedTasks {
  pattern: Task['herhaal_patroon']; // 'eenmalig', 'dagelijks', etc.
  title: string; // Bijv. "Eenmalige Taken"
  tasks: EnrichedTask[];
}

interface TasksPageContainerProps {
  initialTasks?: Task[];
}

export function TasksPageContainer({ initialTasks = [] }: TasksPageContainerProps) {
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get('type');
  const patternFilter = searchParams.get('pattern');

  const { user } = useAuth();
  const userId = user?.id;
  const supabase = getSupabaseBrowserClient();
  const { addNotification } = useNotification(); // Hook bovenaan
  const {
    mutate: deleteTaskMutate,
    isPending: isDeletingTask,
  } = useDeleteTask(); // Hook bovenaan

  const handleDeleteTask = async (taskId: string) => { // Functie bovenaan
    deleteTaskMutate(taskId, {
      onSuccess: () => {
        addNotification({ type: 'success', message: 'Taak succesvol verwijderd.' });
      },
      onError: (error: ErrorMessage) => {
        addNotification({ type: 'error', message: error.userMessage || 'Fout bij verwijderen taak.' });
      }
    });
  };

  // useTasks haalt de basis taken op
  const { data: baseTasks, isLoading, error, isError } = useTasks(
    userId,
    {
      type: typeFilter || undefined,
      pattern: patternFilter || undefined
    },
    {
      initialData: initialTasks.length > 0 ? initialTasks : undefined,
    }
  );

  const [enrichedTasks, setEnrichedTasks] = useState<EnrichedTask[]>([]);

  useEffect(() => {
    const processTasks = async () => {
      if (!baseTasks || baseTasks.length === 0) {
        setEnrichedTasks([]);
        return;
      }

      const taskIds = baseTasks.map(t => t.id);
      let completedTaskIds: Set<string> = new Set();
      let taskLogsMap: Map<string, TaskLog> = new Map();

      if (taskIds.length > 0 && userId) { // userId check toegevoegd
        const { data: logsData, error: logsError } = await supabase
          .from('task_logs')
          .select('*')
          .in('task_id', taskIds)
          .eq('user_id', userId);

        if (logsError) {
          console.warn('Error fetching logs for TasksPageContainer:', logsError.message);
        } else if (logsData) {
          logsData.forEach(log => {
            if (!taskLogsMap.has(log.task_id) || (log.eind_tijd && !taskLogsMap.get(log.task_id)?.eind_tijd)) {
              taskLogsMap.set(log.task_id, log as TaskLog);
            }
            if (log.eind_tijd) {
              completedTaskIds.add(log.task_id);
            }
          });
        }
      }

      const processed = baseTasks.map(task => {
        const status: 'voltooid' | 'openstaand' = completedTaskIds.has(task.id) ? 'voltooid' : 'openstaand';
        const relevantLog = taskLogsMap.get(task.id);
        return {
          ...task,
          status,
          voltooid_op: status === 'voltooid' ? relevantLog?.eind_tijd : null,
        };
      });
      setEnrichedTasks(processed as EnrichedTask[]);
    };

    processTasks();
  }, [baseTasks, userId, supabase]); // userId en supabase toegevoegd als dependencies

  // De data prop voor ConditionalRender moet de originele data zijn die loading state bepaalt
  // De data voor TaskList zijn de enrichedTasks
  const groupedAndFilteredTasks = useMemo(() => {
    if (!enrichedTasks) return [];

    const groups: Record<Task['herhaal_patroon'], EnrichedTask[]> = {
      eenmalig: [],
      dagelijks: [],
      wekelijks: [],
      maandelijks: [],
      aangepast: [],
    };

    enrichedTasks.forEach(task => {
      groups[task.herhaal_patroon].push(task);
    });

    const patternOrder: Task['herhaal_patroon'][] = ['dagelijks', 'wekelijks', 'maandelijks', 'eenmalig', 'aangepast'];

    const result: GroupedTasks[] = patternOrder
      .map(pattern => ({
        pattern,
        title: `${pattern.charAt(0).toUpperCase() + pattern.slice(1)}e Taken`, // Maak titel (bv. Dagelijkse Taken)
        tasks: groups[pattern],
      }))
      .filter(group => group.tasks.length > 0); // Toon alleen groepen met taken

    if (typeFilter) {
      return result.map(group => ({
        ...group,
        tasks: group.tasks.filter(task => task.type === typeFilter)
      })).filter(group => group.tasks.length > 0);
    }
    return result;

  }, [enrichedTasks, typeFilter]); // typeFilter is al in de useTasks hook, maar we filteren hier de gegroepeerde lijst

  return (
    <div className="container mx-auto px-4 py-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-800">Mijn Taken</h1>
        <AddTaskButton />
      </header>

      <TaskFilters /> {/* TaskFilters beïnvloedt 'typeFilter' en 'patternFilter' die door useTasks worden gebruikt */}

      <ConditionalRender
        isLoading={isLoading}
        isError={isError}
        error={isError ? error as ErrorMessage : null}
        data={baseTasks}
        skeletonType="tasks"
        emptyFallback={
          <div className="text-center p-8 bg-white rounded-lg shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Geen taken gevonden</h2>
            <p className="text-gray-500 mb-6">Voeg een nieuwe taak toe om te beginnen.</p>
            <Link href="/taken/nieuw" className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors">
              Taak toevoegen
            </Link>
          </div>
        }
      >
        {() => <TaskList groupedTasks={groupedAndFilteredTasks} onDeleteTask={handleDeleteTask} isDeletingTask={isDeletingTask} />}
      </ConditionalRender>
    </div>
  );
}
