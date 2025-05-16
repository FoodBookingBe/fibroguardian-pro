// containers/dashboard/DailyPlannerContainer.tsx
'use client';
import { useState, useMemo } from 'react'; // Added useMemo
import { useTasks } from '@/hooks/useSupabaseQuery';
import { useAuth } from '@/components/auth/AuthProvider';
import { ConditionalRender } from '@/components/ui/ConditionalRender';
import DailyPlanner from '@/components/dashboard/DailyPlanner'; // Path to existing or new presentational component
import { Task } from '@/types'; // Assuming Task type is in @/types

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


export function DailyPlannerContainer() {
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
  // This example filters by type. DailyPlanner might also need to filter by date (e.g., for "today").
  // That logic would also go here.
  const filteredTasks = useMemo(() => {
    if (!allTasks) return [];
    // Example: Filter for tasks due today (assuming a 'due_date' or similar field on Task)
    // const today = new Date().toISOString().split('T')[0];
    // const tasksForToday = allTasks.filter(task => task.due_date === today);

    // Then apply the type filter
    return allTasks.filter(task => { // Replace allTasks with tasksForToday if date filtering is added
      if (activeFilter === 'all') return true;
      if (activeFilter === 'taak') return task.type === 'taak';
      if (activeFilter === 'opdracht') return task.type === 'opdracht';
      return true; // Should not happen if activeFilter is one of the above
    });
  }, [allTasks, activeFilter]);
  
  return (
    <ConditionalRender
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={allTasks} // Pass allTasks to ensure ConditionalRender doesn't show empty if filteredTasks is empty but allTasks is not
      skeletonType="tasks" // Or a more specific "planner" skeleton
      emptyFallback={<EmptyTasksState />} // This shows if allTasks is empty
    >
      {() => ( // Data from ConditionalRender (allTasks) is implicitly available if needed, but we use filteredTasks
        <DailyPlanner 
          tasks={filteredTasks} // Pass the memoized filtered tasks
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          userId={user?.id || ''} // Pass userId for potential actions within DailyPlanner
          // isLoading prop might be useful for DailyPlanner if it has internal loading states for actions
        />
      )}
    </ConditionalRender>
  );
}
