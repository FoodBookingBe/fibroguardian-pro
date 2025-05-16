'use client';
import { useState } from 'react';
import { Task } from '@/types';
import Link from 'next/link';
import TaskCard from './TaskCard';
import { useDeleteTask } from '@/hooks/useMutations';
import { AlertMessage } from '@/components/common/AlertMessage'; 
import { ErrorMessage } from '@/lib/error-handler';
import { useNotification } from '@/context/NotificationContext'; // Import useNotification

interface TaskListProps {
  tasks: Task[];
  // If TaskList is used by a parent that uses useTasks, 
  // no need to reload window, parent's data will update.
}

export default function TaskList({ tasks }: TaskListProps) {
  // const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null); // Handled by useDeleteTask.isPending
  // const [deleteError, setDeleteError] = useState<string | null>(null); // Handled by useDeleteTask.error
  
  const { 
    mutate: deleteTask, 
    isPending: isDeletingTask, 
    error: deleteTaskHookError, // This will be ErrorMessage type
    isError: isDeleteTaskError,
    // isSuccess: isDeleteSuccess, // Can be used for success messages
  } = useDeleteTask();

  const { addNotification } = useNotification();

  const handleDeleteTask = async (taskId: string) => {
    deleteTask(taskId, {
      onSuccess: () => {
        addNotification('success', 'Taak succesvol verwijderd.');
        // No window.location.reload(); React Query invalidation in useDeleteTask should trigger parent re-render.
      },
      onError: (error) => { // error here is ErrorMessage
        addNotification('error', error.userMessage || 'Fout bij verwijderen taak.');
        console.error('Error deleting task (hook):', error.userMessage);
      }
    });
  };
  
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Geen taken gevonden</h2>
        <p className="text-gray-500 mb-6">Voeg een nieuwe taak toe om te beginnen.</p>
        <Link 
          href="/taken/nieuw" 
          className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
        >
          Taak toevoegen
        </Link>
      </div>
    );
  }
  
  const typedDeleteTaskError = deleteTaskHookError as ErrorMessage | null;

  return (
    <>
      {/* Inline error display for delete might be redundant if global notifications are used for errors too */}
      {/* For now, keeping it as per previous structure, but consider if addNotification('error', ...) is sufficient */}
      {isDeleteTaskError && typedDeleteTaskError && (
        <AlertMessage type="error" title="Fout bij verwijderen" message={typedDeleteTaskError.userMessage || 'Kon taak niet verwijderen.'} className="mb-4" />
      )}
      {/* Success messages are now handled by global notifications */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onDelete={handleDeleteTask}
            isDeleting={isDeletingTask} // Pass deleting state to TaskCard if it needs to show individual loading
          />
        ))}
      </div>
    </>
  );
}
