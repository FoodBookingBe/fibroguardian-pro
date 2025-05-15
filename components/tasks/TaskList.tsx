'use client';
import { useState } from 'react';
import { Task } from '@/types';
import Link from 'next/link';
import TaskCard from './TaskCard';

interface TaskListProps {
  tasks: Task[];
}

export default function TaskList({ tasks }: TaskListProps) {
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  
  const handleDeleteTask = async (taskId: string) => {
    try {
      setDeletingTaskId(taskId);
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete task');
      }
      
      // Refresh the page to show the updated task list
      window.location.reload();
    } catch (error: any) {
      console.error('Error deleting task:', error);
      alert(`Er is een fout opgetreden bij het verwijderen van de taak: ${error.message}`);
    } finally {
      setDeletingTaskId(null);
    }
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
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map(task => (
        <TaskCard 
          key={task.id} 
          task={task} 
          onDelete={handleDeleteTask}
        />
      ))}
    </div>
  );
}
