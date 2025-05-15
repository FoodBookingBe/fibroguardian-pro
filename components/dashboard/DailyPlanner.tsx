'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Task } from '@/types';
import TaskCard from '@/components/tasks/TaskCard';

interface DailyPlannerProps {
  tasks: Task[];
  userId: string;
}

export default function DailyPlanner({ tasks, userId }: DailyPlannerProps) {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  const filterTasks = (filter: string) => {
    setActiveFilter(filter);
  };
  
  // Filter de taken
  const filteredTasks = tasks.filter(task => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'taak') return task.type === 'taak';
    if (activeFilter === 'opdracht') return task.type === 'opdracht';
    return true;
  });
  
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
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-wrap items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Dagplanning</h2>
        
        <div className="flex space-x-2 mt-2 sm:mt-0">
          <button
            onClick={() => filterTasks('all')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeFilter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-pressed={activeFilter === 'all' ? 'true' : 'false'}
            aria-label="Toon alle taken"
          >
            Alles
          </button>
          <button
            onClick={() => filterTasks('taak')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeFilter === 'taak'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-pressed={activeFilter === 'taak' ? 'true' : 'false'}
            aria-label="Toon alleen taken"
          >
            Taken
          </button>
          <button
            onClick={() => filterTasks('opdracht')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeFilter === 'opdracht'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-pressed={activeFilter === 'opdracht' ? 'true' : 'false'}
            aria-label="Toon alleen opdrachten"
          >
            Opdrachten
          </button>
        </div>
      </div>
      
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onDelete={handleDeleteTask}
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
