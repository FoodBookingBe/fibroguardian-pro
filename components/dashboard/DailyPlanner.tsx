'use client';
import React, { useState } from 'react'; // Keep useState for confirmDelete if needed locally in TaskCard
import Link from 'next/link';
import { Task } from '@/types';
import TaskCard from '@/components/tasks/TaskCard';
import { useDeleteTask } from '@/hooks/useMutations';
import { useNotification } from '@/context/NotificationContext';
import { ErrorMessage } from '@/lib/error-handler'; // For typing error from hook

interface DailyPlannerProps {
  tasks: Task[]; // This will be pre-filtered tasks from the container
  userId: string; // Needed for context or if actions are user-specific
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  // isLoading?: boolean; // If container wants to pass loading state for individual items
}

function DailyPlanner({ 
  tasks, 
  userId, // userId might not be directly used if tasks are already filtered for the user
  activeFilter,
  onFilterChange,
}: DailyPlannerProps) {
  
  const { 
    mutate: deleteTask, 
    isPending: isDeletingTask, // This is a general deleting state for any task
    // error: deleteTaskError, // Handled by addNotification
    // isError: isDeleteError // Handled by addNotification
  } = useDeleteTask();
  const { addNotification } = useNotification();
  
  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId, {
      onSuccess: () => {
        addNotification('success', 'Taak succesvol verwijderd.');
        // Query invalidation is handled by the useDeleteTask hook,
        // which should cause DailyPlannerContainer to re-fetch/re-filter tasks.
      },
      onError: (error: ErrorMessage) => { // Explicitly type error
        addNotification('error', error.userMessage || 'Fout bij verwijderen van taak.');
      }
    });
  };
  
  // tasks prop is now the already filtered list from DailyPlannerContainer
  const tasksToDisplay = tasks;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-wrap items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Dagplanning</h2>
        
        <div className="flex space-x-2 mt-2 sm:mt-0">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeFilter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-pressed={activeFilter === 'all'}
            aria-label="Toon alle taken"
          >
            Alles
          </button>
          <button
            onClick={() => onFilterChange('taak')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeFilter === 'taak'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-pressed={activeFilter === 'taak'}
            aria-label="Toon alleen taken"
          >
            Taken
          </button>
          <button
            onClick={() => onFilterChange('opdracht')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeFilter === 'opdracht'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-pressed={activeFilter === 'opdracht'}
            aria-label="Toon alleen opdrachten"
          >
            Opdrachten
          </button>
        </div>
      </div>
      
      {tasksToDisplay.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {tasksToDisplay.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onDelete={handleDeleteTask}
              // Pass isDeletingTask if TaskCard should show a global deleting indicator.
              // If TaskCard handles its own confirm/delete spinner, this might not be needed,
              // or it could be `isDeleting={isDeletingTask && deletingTaskId === task.id}` if we track specific ID.
              // For simplicity, TaskCard's internal confirm/delete spinner is often sufficient.
              // The `isDeleting` prop was added to TaskCard to show a spinner on its delete button.
              isDeleting={isDeletingTask} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            {activeFilter === 'all' ? 'Geen taken gepland voor vandaag' : 
             activeFilter === 'taak' ? 'Geen taken van het type "Taak" gepland voor vandaag' :
             'Geen taken van het type "Opdracht" gepland voor vandaag'}
          </p>
          <Link
            href="/taken/nieuw"
            className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
          >
            Taak toevoegen
          </Link>
        </div>
      )}
    </div>
  );
}

export default React.memo(DailyPlanner);
