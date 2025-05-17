import DashboardLayout from '@/components/layout/DashboardLayout';
// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'; // Old import
// import { createServerClient } from '@supabase/ssr'; 
// import { cookies } from 'next/headers'; 
import { getSupabaseServerComponentClient } from '@/lib/supabase'; 
import { DailyPlannerContainer } from '@/containers/dashboard/DailyPlannerContainer'; // Updated import
import HealthMetrics from '@/components/dashboard/HealthMetrics';
import { AIInsightsContainer } from '@/containers/dashboard/AIInsightsContainer'; // Updated import
import QuickActions from '@/components/dashboard/QuickActions';
import SessionStatus from '@/components/debug/SessionStatus';
import { Database } from '@/types/database'; // Assuming you have this type

export default async function Dashboard() {
  // const cookieStore = cookies(); // Handled by getSupabaseServerComponentClient
  const supabase = getSupabaseServerComponentClient(); // Use centralized server client
  
  // Authentication is now handled by app/dashboard/layout.tsx
  // but we still need user data here for page content
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    // This case should ideally be handled by the layout redirecting,
    // but as a safeguard or if layout logic changes:
    // redirect('/auth/login'); // Or handle appropriately
    console.error('Dashboard Page: User not found or error fetching user.', userError);
    return null; // Or some fallback UI
  }
  
  // Fetch tasks for the daily planner
  const { data: tasksData, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id) // Use user.id
    .order('created_at', { ascending: false });
  
  if (tasksError) {
    console.error('Error fetching tasks:', tasksError);
  }
  
  // Fetch task logs for health metrics
  const { data: logsData, error: logsError } = await supabase
    .from('task_logs')
    .select('*')
    .eq('user_id', user.id) // Use user.id
    .order('start_tijd', { ascending: false })
    .limit(30);
  
  if (logsError) {
    console.error('Error fetching task logs:', logsError);
  }
  
  // Fetch insights for AI insights
  const { data: insightsData, error: insightsError } = await supabase
    .from('inzichten')
    .select('*')
    .eq('user_id', user.id) // Use user.id
    .order('created_at', { ascending: false })
    .limit(3);
  
  if (insightsError) {
    console.error('Error fetching insights:', insightsError);
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        {process.env.NODE_ENV !== 'production' && <SessionStatus />}
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-800">
            Dashboard
          </h1>
          <p className="text-gray-600">Welkom bij FibroGuardian Pro</p>
        </header>

        {/* Dashboard content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section id="daily-planner" className="lg:col-span-2">
            {/* DailyPlannerContainer does not take tasks or userId as props, it fetches its own */}
            <DailyPlannerContainer /> 
          </section>

          <section id="health-metrics">
            <HealthMetrics logs={logsData || []} />
          </section>
        </div>

        <section id="ai-insights" className="mt-8">
          <AIInsightsContainer initialInsightsProp={insightsData || []} />
        </section>

        <section id="quick-actions" className="mt-8">
          <QuickActions />
        </section>
      </div>
    </DashboardLayout>
  );
}
