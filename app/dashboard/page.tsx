import DashboardLayout from '@/components/layout/DashboardLayout';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import DailyPlanner from '@/components/dashboard/DailyPlanner';
import HealthMetrics from '@/components/dashboard/HealthMetrics';
import AIInsights from '@/components/dashboard/AIInsights';
import QuickActions from '@/components/dashboard/QuickActions';
import SessionStatus from '@/components/debug/SessionStatus';
export default async function Dashboard() {
  // const supabase = createServerComponentClient({ cookies }); // No longer needed here if layout handles auth
  
  // Authentication is now handled by app/dashboard/layout.tsx
  // const { data: { session } } = await supabase.auth.getSession();
  
  // if (!session) {
  //   return null;
  // }
  
  // Haal benodigde data op
  // (je dashboard data ophaling logic hier)
  // For now, let's assume no critical data fetching here that could fail silently.
  // If there is, it needs robust error handling.
  
  return (
    <DashboardLayout>
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
            <DailyPlanner tasks={[]} userId={session.user.id} />
          </section>

          <section id="health-metrics">
            <HealthMetrics logs={[]} />
          </section>
        </div>

        <section id="ai-insights" className="mt-8">
          <AIInsights insights={[]} />
        </section>

        <section id="quick-actions" className="mt-8">
          <QuickActions />
        </section>
      </div>
    </DashboardLayout>
  );
}
