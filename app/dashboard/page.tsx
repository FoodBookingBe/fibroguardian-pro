import DashboardLayout from '@/components/layout/DashboardLayout';
// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'; // Old import
import { createServerClient } from '@supabase/ssr'; // New import for App Router
import { cookies } from 'next/headers';
import DailyPlanner from '@/components/dashboard/DailyPlanner';
import HealthMetrics from '@/components/dashboard/HealthMetrics';
import AIInsights from '@/components/dashboard/AIInsights';
import QuickActions from '@/components/dashboard/QuickActions';
import SessionStatus from '@/components/debug/SessionStatus';
import { Database } from '@/types/database'; // Assuming you have this type

export default async function Dashboard() {
  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // If you need to set/remove cookies in Server Actions within this component/page:
        // set(name: string, value: string, options: CookieOptions) {
        //   cookieStore.set({ name, value, ...options });
        // },
        // remove(name: string, options: CookieOptions) {
        //   cookieStore.delete({ name, ...options });
        // },
      },
    }
  );
  
  // Authentication is now handled by app/dashboard/layout.tsx
  // but we still need session data here for page content
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // This case should ideally be handled by the layout redirecting,
    // but as a safeguard or if layout logic changes:
    // redirect('/auth/login'); // Or handle appropriately
    return null; // Or some fallback UI
  }
  
  // Fetch tasks for the daily planner
  const { data: tasksData, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });
  
  if (tasksError) {
    console.error('Error fetching tasks:', tasksError);
  }
  
  // Fetch task logs for health metrics
  const { data: logsData, error: logsError } = await supabase
    .from('task_logs')
    .select('*')
    .eq('user_id', session.user.id)
    .order('start_tijd', { ascending: false })
    .limit(30);
  
  if (logsError) {
    console.error('Error fetching task logs:', logsError);
  }
  
  // Fetch insights for AI insights
  const { data: insightsData, error: insightsError } = await supabase
    .from('inzichten')
    .select('*')
    .eq('user_id', session.user.id)
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
            <DailyPlanner tasks={tasksData || []} userId={session.user.id} />
          </section>

          <section id="health-metrics">
            <HealthMetrics logs={logsData || []} />
          </section>
        </div>

        <section id="ai-insights" className="mt-8">
          <AIInsights insights={insightsData || []} />
        </section>

        <section id="quick-actions" className="mt-8">
          <QuickActions />
        </section>
      </div>
    </DashboardLayout>
  );
}
