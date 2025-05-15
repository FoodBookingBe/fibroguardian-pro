'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Task } from '@/types';
import TaskList from './TaskList';
import TaskFilters from './TaskFilters';
import AddTaskButton from './AddTaskButton';

interface TasksPageClientProps {
  initialTasks: Task[];
}

export default function TasksPageClient({ initialTasks }: TasksPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(initialTasks);
  
  // Apply filters from URL parameters
  useEffect(() => {
    const typeFilter = searchParams.get('type');
    const patternFilter = searchParams.get('pattern');
    
    if (!typeFilter && !patternFilter) {
      setFilteredTasks(tasks);
      return;
    }
    
    const filtered = tasks.filter(task => {
      if (typeFilter && task.type !== typeFilter) {
        return false;
      }
      if (patternFilter && task.herhaal_patroon !== patternFilter) {
        return false;
      }
      return true;
    });
    
    setFilteredTasks(filtered);
  }, [searchParams, tasks]);
  
  const handleFilterChange = (filters: { type?: string; pattern?: string }) => {
    // This function is passed to TaskFilters component
    // The actual filtering is done in the useEffect above when the URL parameters change
    // This is just a placeholder for any additional logic you might want to add
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-800">Mijn Taken</h1>
        <AddTaskButton />
      </header>
      
      <TaskFilters onFilterChange={handleFilterChange} />
      
      <TaskList tasks={filteredTasks} />
    </div>
  );
}
