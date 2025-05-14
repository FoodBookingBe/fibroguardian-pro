import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DailyPlanner from '@/components/dashboard/DailyPlanner';
import HealthMetrics from '@/components/dashboard/HealthMetrics';
import AIInsights from '@/components/dashboard/AIInsights';
import QuickActions from '@/components/dashboard/QuickActions';
import { Task, TaskLog, Inzicht, Profile } from '@/types';

export default async function Dashboard() {
  const supabase = createServerComponentClient({ cookies });
  
  // Check authentication op server
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/');
  }
  
  // Parallelle data fetching om performance te verbeteren
  const [profileResponse, todaysPlanningResponse, recurringTasksResponse, logsResponse, insightsResponse] = 
    await Promise.all([
      // Haal gebruikersprofiel op
      supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single(),
        
      // Haal planning voor vandaag op
      supabase
        .from('planning')
        .select('task_ids')
        .eq('user_id', session.user.id)
        .eq('datum', new Date().toISOString().split('T')[0])
        .single(),
        
      // Haal herhaalde taken op
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session.user.id)
        .neq('herhaal_patroon', 'eenmalig'),
        
      // Haal recente logs op
      supabase
        .from('task_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(5),
        
      // Haal AI inzichten op
      supabase
        .from('inzichten')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(3)
    ]);
  
  let profile: Profile = profileResponse.data || { 
    id: session.user.id, 
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
          <DailyPlanner tasks={todaysTasks} userId={session.user.id} />
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