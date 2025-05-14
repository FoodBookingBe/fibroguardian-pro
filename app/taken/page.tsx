import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TaskList from '@/components/tasks/TaskList';
import TaskFilters from '@/components/tasks/TaskFilters';
import AddTaskButton from '@/components/tasks/AddTaskButton';
import { Task } from '@/types';

export default async function TakenPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Check authentication op server
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/');
  }
  
  // Taken ophalen
  const { data: tasksData } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });
  
  const tasks: Task[] = tasksData || [];
  
  return (
    <div className="container mx-auto px-4 py-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-800">Mijn Taken</h1>
        <AddTaskButton />
      </header>
      
      <TaskFilters />
      
      <TaskList tasks={tasks} />
    </div>
  );
}