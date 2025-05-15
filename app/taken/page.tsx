import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TaskList from '@/components/tasks/TaskList';
import TaskFilters from '@/components/tasks/TaskFilters';
import AddTaskButton from '@/components/tasks/AddTaskButton';
import { Task } from '@/types';
import DashboardLayout from '@/components/layout/DashboardLayout'; // Import DashboardLayout

export default async function TakenPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
  
  // Check authentication op server
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // Middleware should handle redirecting unauthenticated users to login.
    // If for some reason middleware didn't catch it, or if user becomes null
    // after being authenticated (e.g. token revoked), redirect to login.
    redirect('/auth/login');
  }
  
  // Taken ophalen
  const { data: tasksData } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id) // Use user.id
    .order('created_at', { ascending: false });
  
  const tasks: Task[] = tasksData || [];
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-800">Mijn Taken</h1>
          <AddTaskButton />
        </header>
        
        <TaskFilters />
        
        <TaskList tasks={tasks} />
      </div>
    </DashboardLayout>
  );
}
