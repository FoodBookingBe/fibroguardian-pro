'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Task } from '@/types';
import TaskList from '@/components/tasks/TaskList'; // Adjusted path
import TaskFilters from '@/components/tasks/TaskFilters'; // Adjusted path
import AddTaskButton from '@/components/tasks/AddTaskButton'; // Adjusted path
import { useTasks } from '@/hooks/useSupabaseQuery';
import { useAuth } from '@/components/auth/AuthProvider';
import { ConditionalRender } from '@/components/ui/ConditionalRender';

interface TasksPageContainerProps {
  initialTasks?: Task[]; // Make initialTasks optional, container might not always get SSR data
}

export function TasksPageContainer({ initialTasks = [] }: TasksPageContainerProps) { // Default to empty array
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get('type');
  const patternFilter = searchParams.get('pattern');
  
  const { user } = useAuth();
  const userId = user?.id;

  const { data: tasks, isLoading, error, isError } = useTasks(
    userId, 
    { 
      type: typeFilter || undefined, 
      pattern: patternFilter || undefined 
    },
    { 
      initialData: initialTasks.length > 0 ? initialTasks : undefined, // Pass initialData only if it exists
      // enabled: !!userId, // useTasks already has this
    }
  );
  
  return (
    <div className="container mx-auto px-4 py-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-800">Mijn Taken</h1>
        <AddTaskButton />
      </header>
      
      <TaskFilters />
      
      <ConditionalRender
        isLoading={isLoading}
        isError={isError}
        error={error}
        data={tasks}
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
        {(tasksData) => <TaskList tasks={tasksData} />}
      </ConditionalRender>
    </div>
  );
}
