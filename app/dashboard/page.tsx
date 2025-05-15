import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DailyPlanner from '@/components/dashboard/DailyPlanner';
import HealthMetrics from '@/components/dashboard/HealthMetrics';
import AIInsights from '@/components/dashboard/AIInsights';
import QuickActions from '@/components/dashboard/QuickActions';
import { Task, TaskLog, Inzicht, Profile } from '@/types';

export default async function Dashboard() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // set and remove are not strictly necessary for read-only operations like getSession
        // but including them for completeness if other auth actions were to be performed here.
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
  const { data: { user } } = await supabase.auth.getUser(); // Changed to getUser()
  
  // Middleware.ts is responsible for redirecting unauthenticated users.
  // If execution reaches this server component for /dashboard, we assume middleware has allowed it,
  // implying a session should exist. If session or session.user.id is unexpectedly null here,
  // data fetching will fail, and the page should handle that (e.g., show error or empty state)
  // rather than this component also trying to redirect, which can cause loops.
  
  if (!user?.id) { // Check user.id directly
    // This case should ideally be caught by middleware.
    // If it's reached, it means an authenticated user somehow lacks a user ID in their session,
    // or the user object is not yet fully available to the server component.
    // Middleware should have redirected if no authenticated user.
    // If user is authenticated but user.id is missing, this is an unexpected state.
    console.error("Dashboard Server Component: user.id is missing after auth.getUser(). This indicates an issue with the user object or session state. Redirecting to login.");
    // It's safer to redirect to login if user.id is not available, as data fetching depends on it.
    redirect('/auth/login');
    // Note: The console error above will appear in server logs.
    // Consider returning an error component for a better UX if this state is possible.
    // For now, redirect is a hard stop.
  }
  
  // At this point, user and user.id should be valid due to the check above and middleware.
  const userId = user.id; // user.id is now guaranteed to be a string

  const [profileResponse, todaysPlanningResponse, recurringTasksResponse, logsResponse, insightsResponse] =
    await Promise.all([
      // Haal gebruikersprofiel op
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId) // Use guarded userId
        .single(),
        
      // Haal planning voor vandaag op
      supabase
        .from('planning')
        .select('task_ids')
        .eq('user_id', userId) // Use guarded userId
        .eq('datum', new Date().toISOString().split('T')[0])
        .single(),
        
      // Haal herhaalde taken op
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId) // Use guarded userId
        .neq('herhaal_patroon', 'eenmalig'),
        
      // Haal recente logs op
      supabase
        .from('task_logs')
        .select('*')
        .eq('user_id', userId) // Use guarded userId
        .order('created_at', { ascending: false })
        .limit(5),
        
      // Haal AI inzichten op
      supabase
        .from('inzichten')
        .select('*')
        .eq('user_id', userId) // Use guarded userId
        .order('created_at', { ascending: false })
        .limit(3)
    ]);
  
  let profile: Profile = profileResponse.data || { 
    id: userId, // Use guarded userId
    voornaam: '', 
    achternaam: '', 
    type: 'patient',
    created_at: new Date(),
    updated_at: new Date()
  };
  
  let todaysTasks: Task[] = [];
  
  // Verwerk planning data
  if (todaysPlanningResponse.data && todaysPlanningResponse.data.task_ids && todaysPlanningResponse.data.task_ids.length > 0) {
    const { data: taskData } = await supabase
      .from('tasks')
      .select('*')
      .in('id', todaysPlanningResponse.data.task_ids);
    
    todaysTasks = taskData || [];
  } else {
    // Filter herhaalde taken voor vandaag
    const recurringTasks = recurringTasksResponse.data || [];
    const dayOfWeek = new Date().getDay().toString(); // Sunday - Saturday : 0 - 6
    
    todaysTasks = recurringTasks.filter(task => {
      if (task.herhaal_patroon === 'dagelijks') return true;
      if (task.herhaal_patroon === 'wekelijks' && task.dagen_van_week?.includes(dayOfWeek)) return true;
      // Add more complex logic for 'maandelijks' or 'aangepast' if needed
      return false;
    });
  }
  
  const recentLogs: TaskLog[] = logsResponse.data || [];
  const insights: Inzicht[] = insightsResponse.data || [];

  return (
    <div className="container mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-800">
          Welkom, {profile?.voornaam || 'daar'}!
        </h1>
        <p className="text-gray-600">Hier is uw dagelijks overzicht</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section id="daily-planner" className="lg:col-span-2">
          <DailyPlanner tasks={todaysTasks} userId={userId} /> {/* Use guarded userId */}
        </section>

        <section id="health-metrics">
          <HealthMetrics logs={recentLogs} />
        </section>
      </div>

      <section id="ai-insights" className="mt-8">
        <AIInsights insights={insights} />
      </section>

      <section id="quick-actions" className="mt-8">
        <QuickActions />
      </section>
    </div>
  );
}
