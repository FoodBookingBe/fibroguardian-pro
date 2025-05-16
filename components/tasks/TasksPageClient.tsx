'use client';
// Removed useState, useEffect as data fetching and filtering will be handled by useTasks
import { useSearchParams } from 'next/navigation'; // useRouter might not be needed directly anymore
import Link from 'next/link'; // Import Link
import { Task } from '@/types';
import TaskList from './TaskList';
import TaskFilters from './TaskFilters';
import AddTaskButton from './AddTaskButton';
import { useTasks } from '@/hooks/useSupabaseQuery'; // Import the hook
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'; 
import { AlertMessage } from '@/components/common/AlertMessage'; 
import { useAuth } from '@/components/auth/AuthProvider'; 
import { ConditionalRender } from '@/components/ui/ConditionalRender'; // Import ConditionalRender
// import EmptyTaskState from './EmptyTaskState'; // Assuming this would be created

interface TasksPageClientProps {
  initialTasks: Task[]; // SSR data
}

export default function TasksPageClient({ initialTasks }: TasksPageClientProps) {
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get('type');
  const patternFilter = searchParams.get('pattern');
  
  const { user } = useAuth(); // Get current user
  const userId = user?.id;

  // React Query hook gebruiken
  // The userId from initialTasks[0]?.user_id is a fallback if user from useAuth isn't available yet,
  // but ideally, userId from useAuth should be primary.
  // The hook's `enabled: !!userId` will prevent running if userId is initially undefined.
  const { data: tasks, isLoading, error, isError, status } = useTasks( // Added status
    userId || initialTasks[0]?.user_id, // Prioritize userId from auth context
    { 
      type: typeFilter || undefined, 
      pattern: patternFilter || undefined 
    },
    { 
      initialData: initialTasks, // Use SSR data as initialData
      // Keep data from initialData if query is disabled (e.g. no userId yet)
      // or until the first successful fetch.
      // staleTime is set in useSupabaseQuery, so data will be considered fresh for 5 mins.
    }
  );
  
  
  
  // The handleFilterChange in the original component was a placeholder.
  // Filtering is now primarily driven by URL searchParams which are passed to useTasks.
  // TaskFilters component would typically update the URL searchParams, triggering a re-fetch by useTasks.
  
  return (
    <div className="container mx-auto px-4 py-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-800">Mijn Taken</h1>
        <AddTaskButton />
      </header>
      
      <TaskFilters /> {/* onFilterChange is not directly used here anymore as filters drive useTasks hook via URL */}
      
      <ConditionalRender
        isLoading={isLoading}
        isError={isError} // Pass isError from the hook
        error={error}    // Pass error object from the hook
        data={tasks}
        skeletonType="tasks" // This type needs to be defined in SkeletonLoader
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
