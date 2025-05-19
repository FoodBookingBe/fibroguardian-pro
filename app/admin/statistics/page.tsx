// app/admin/statistics/page.tsx
import { getSupabaseServerComponentClient } from '@/lib/supabase-server'; 
import Link from 'next/link'; 
import UserSignupsChart from '@/components/admin/charts/UserSignupsChart';
import TaskCompletionChart from '@/components/admin/charts/TaskCompletionChart'; // Import the new chart component

export const dynamic = 'force-dynamic';

interface SubscriptionPlanCount {
  plan_type: string | null;
  count: number;
}
interface StatData {
  totalUsers: number | null;
  patientCount: number | null;
  specialistCount: number | null;
  adminCount: number | null;
  totalSubscriptions: number | null;
  subscriptionCountsByPlan: SubscriptionPlanCount[];
  totalTaskLogs: number | null;
  userSignupsByMonth?: { month: string; count: number }[]; 
  taskCompletionsByMonth?: { month: string; count: number }[]; // Added for task chart
  fetchError?: string;
}

async function getStats(): Promise<StatData> {
  const supabase = getSupabaseServerComponentClient();
  try {
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('type, created_at'); 

    if (profilesError) throw new Error(`Error fetching profiles data: ${profilesError.message}`);
    
    let patientCount = 0;
    let specialistCount = 0;
    let adminCount = 0;
    profilesData?.forEach(p => {
      if (p.type === 'patient') patientCount++;
      if (p.type === 'specialist') specialistCount++;
      if (p.type === 'admin') adminCount++;
    });
    const totalUsers = profilesData?.length ?? 0;

    const signupsByMonth: { [key: string]: number } = {};
    if (profilesData) {
      profilesData.forEach(profile => {
        if (profile.created_at) {
          const month = new Date(profile.created_at).toISOString().substring(0, 7); 
          signupsByMonth[month] = (signupsByMonth[month] || 0) + 1;
        }
      });
    }
    const userSignupsByMonthData = Object.entries(signupsByMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month)); 

    const { data: abonnementenRawData, error: abonnementenError } = await supabase
      .from('abonnementen')
      .select('plan_type'); 

    if (abonnementenError) throw new Error(`Error fetching subscription data: ${abonnementenError.message}`);

    const planCounts: { [key: string]: number } = {};
    (abonnementenRawData || []).forEach((item: any) => {
        const plan = item.plan_type || 'onbekend';
        planCounts[plan] = (planCounts[plan] || 0) + 1;
    });
    const subsByTypeData = Object.entries(planCounts).map(([plan_type, count]) => ({ plan_type, count }));
    const totalSubscriptions = abonnementenRawData?.length ?? 0;

    const { data: taskLogsRawData, error: taskLogsError } = await supabase
      .from('task_logs')
      .select('created_at'); // Select created_at for grouping by month

    if (taskLogsError) throw new Error(`Error fetching task logs data: ${taskLogsError.message}`);
    
    const totalTaskLogs = taskLogsRawData?.length ?? 0;

    // Process task completions by month
    const completionsByMonth: { [key: string]: number } = {};
    if (taskLogsRawData) {
      taskLogsRawData.forEach(log => {
        if (log.created_at) {
          const month = new Date(log.created_at).toISOString().substring(0, 7); // YYYY-MM
          completionsByMonth[month] = (completionsByMonth[month] || 0) + 1;
        }
      });
    }
    const taskCompletionsByMonthData = Object.entries(completionsByMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalUsers,
      patientCount,
      specialistCount,
      adminCount,
      totalSubscriptions,
      subscriptionCountsByPlan: subsByTypeData || [],
      totalTaskLogs: totalTaskLogs, // Use the count from iterated data
      userSignupsByMonth: userSignupsByMonthData,
      taskCompletionsByMonth: taskCompletionsByMonthData, // Add to return
    };
  } catch (error: unknown) { 
    console.error("Error fetching statistics:", error);
    let message = "Kon statistieken niet laden.";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }
    return {
      totalUsers: null,
      patientCount: null,
      specialistCount: null,
      adminCount: null,
      totalSubscriptions: null,
      subscriptionCountsByPlan: [],
      totalTaskLogs: null,
      userSignupsByMonth: [], 
      taskCompletionsByMonth: [], // Default to empty array on error
      fetchError: message,
    };
  }
}

export default async function AdminStatisticsPage() {
  const stats = await getStats();

  const StatCard: React.FC<{ title: string; value: string | number | null; link?: string; linkText?: string }> = ({ title, value, link, linkText }) => (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{value ?? 'N/A'}</p>
      </div>
      {link && linkText && (
        <div className="mt-4">
          <Link href={link} className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            {linkText} &rarr;
          </Link>
        </div>
      )}
    </div>
  );
  
  const getPlanDisplayName = (planType: string | null | undefined) => {
    if (!planType) return 'Onbekend Plan';
    const safePlanType = String(planType).toLowerCase();
    switch (safePlanType) {
      case 'basis': return 'Basis Plan';
      case 'premium': return 'Premium Plan';
      case 'enterprise': return 'Enterprise Plan';
      case 'onbekend': return 'Onbekend Plan'; 
      default: return planType;
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Statistieken Overzicht</h1>
      
      {stats.fetchError && (
        <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
          <span className="font-medium">Fout bij laden statistieken:</span> {stats.fetchError}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Gebruikers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Totaal Gebruikers" value={stats.totalUsers} link="/admin/users" linkText="Beheer Gebruikers" />
          <StatCard title="Patiënten" value={stats.patientCount} link="/admin/users?type=patient" linkText="Bekijk Patiënten" />
          <StatCard title="Specialisten" value={stats.specialistCount} link="/admin/users?type=specialist" linkText="Bekijk Specialisten" />
          <StatCard title="Admins" value={stats.adminCount} />
        </div>

        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Abonnementen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Totaal Abonnementen" value={stats.totalSubscriptions} link="/admin/subscriptions" linkText="Beheer Abonnementen" />
          {stats.subscriptionCountsByPlan.map(plan => (
            <StatCard 
              key={plan.plan_type || 'unknown_plan_key'} 
              title={getPlanDisplayName(plan.plan_type)} 
              value={plan.count} 
              link={`/admin/subscriptions?plan=${plan.plan_type || 'onbekend'}`}
              linkText="Bekijk Details"
            />
          ))}
        </div>
        
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Activiteit</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Totaal Taak Logs" value={stats.totalTaskLogs} />
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Data Visualisaties</h2>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">Nieuwe Gebruikers Per Periode</h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg min-h-[300px]">
              {stats.userSignupsByMonth && stats.userSignupsByMonth.length > 0 ? (
                <UserSignupsChart data={stats.userSignupsByMonth} />
              ) : (
                <p className="text-gray-400 dark:text-gray-500 flex items-center justify-center h-full">Geen data voor gebruikersaanmeldingen grafiek.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">Taak Voltooiing Trends</h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg min-h-[300px]">
              {stats.taskCompletionsByMonth && stats.taskCompletionsByMonth.length > 0 ? (
                <TaskCompletionChart data={stats.taskCompletionsByMonth} />
              ) : (
                <p className="text-gray-400 dark:text-gray-500 flex items-center justify-center h-full">Geen data voor taakvoltooiing grafiek.</p>
              )}
            </div>
          </div>
           <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Meer gedetailleerde grafieken en data analyses worden hier geïmplementeerd.
          </p>
        </div>
      </div>
    </div>
  );
}
