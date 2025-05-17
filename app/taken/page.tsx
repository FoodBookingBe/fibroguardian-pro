import { redirect } from 'next/navigation';
import { Task } from '@/types';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TasksPageContainer } from '@/containers/tasks/TasksPageContainer'; // Updated import
import { getSupabaseServerComponentClient } from '@/lib/supabase'; // Import server client helper

export default async function TakenPage() {
  const supabase = getSupabaseServerComponentClient(); // Use helper
  
  // Check authentication op server
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/login');
  }
  
  // Fetch all tasks for the user
  const { data: tasksData, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching tasks:', error);
  }
  
  const tasks: Task[] = tasksData || [];
  
  return (
    <DashboardLayout>
      <TasksPageContainer initialTasks={tasks} />
    </DashboardLayout>
  );
}
