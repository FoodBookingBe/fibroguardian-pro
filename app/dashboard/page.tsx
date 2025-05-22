import React from 'react';

import { TaskLog, Inzicht, Profile } from '@/types';

import AdminStatsCards from '@/components/admin/AdminStatsCards';
import RecentUsersTable from '@/components/admin/RecentUsersTable';
import HealthMetrics from '@/components/dashboard/HealthMetrics';
import QuickActions from '@/components/dashboard/QuickActions';
import SessionStatus from '@/components/debug/SessionStatus';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { AIInsightsContainer } from '@/containers/dashboard/AIInsightsContainer';
import { DailyPlannerContainer } from '@/containers/dashboard/DailyPlannerContainer';
import { getSupabaseServerComponentClient } from '@/lib/supabase-server';

import DashboardClient from './dashboard-client';

export default async function Dashboard() {
  const supabase = getSupabaseServerComponentClient();
  
  // Get user data
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('Dashboard Page: User not found or error fetching user.', userError);
    return null;
  }
  
  // Fetch user profile to determine role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    return null;
  }
  
  const userRole = profile?.type || 'patient';
  
  console.log('[Dashboard Page Server Component] User ID:', user?.id, 'Profile Data:', profile, 'Determined Role:', userRole);

  // Fetch data based on user role
  let logsData: TaskLog[] = []; // Specifieke type voor task logs
  let insightsData: Inzicht[] = []; // Specifieke type voor inzichten
  let recentUsersData: Profile[] = []; // Specifieke type voor gebruikersprofielen
  let statsData: { totalUsers: number; totalTasks: number; totalLogs: number } = { // Voldoet aan AdminStats
    totalUsers: 0,
    totalTasks: 0,
    totalLogs: 0,
  };
  
  if (userRole === 'patient') {
    // Fetch task logs for health metrics
    const { data: logs, error: logsError } = await supabase
      .from('task_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('start_tijd', { ascending: false })
      .limit(30);
    
    if (logsError) {
      console.error('Error fetching task logs:', logsError);
    } else {
      logsData = logs || [];
    }
    
    // Fetch insights for AI insights
    const { data: insights, error: insightsError } = await supabase
      .from('inzichten')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (insightsError) {
      console.error('Error fetching insights:', insightsError);
    } else {
      insightsData = insights || [];
    }
  } else if (userRole === 'admin') {
    // Fetch recent users for admin dashboard
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (usersError) {
      console.error('Error fetching recent users:', usersError);
    } else {
      recentUsersData = users || [];
    }
    
    // Fetch stats for admin dashboard
    // This is a placeholder - in a real app, you would fetch actual stats
    // Ensure this matches the AdminStats interface from AdminStatsCards.tsx
    statsData = {
      totalUsers: recentUsersData.length,
      totalTasks: 120, // Placeholder
      totalLogs: 0,    // Placeholder - Add actual logic to fetch this
    };
  } else if (userRole === 'specialist') {
    // Fetch patient insights for specialist dashboard
    const { data: patientConnections, error: connectionsError } = await supabase
      .from('specialist_patienten') // Corrected table name
      .select('patient_id')
      .eq('specialist_id', user.id);
    
    if (connectionsError) {
      console.error('Error fetching patient connections:', connectionsError);
    } else if (patientConnections && patientConnections.length > 0) {
      const patientIds = patientConnections.map(conn => conn.patient_id);
      
      // Fetch insights for all patients
      const { data: insights, error: insightsError } = await supabase
        .from('inzichten')
        .select('*')
        .in('user_id', patientIds)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (insightsError) {
        console.error('Error fetching patient insights:', insightsError);
      } else {
        insightsData = insights || [];
      }
    }
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        {process.env.NODE_ENV !== 'production' && <SessionStatus />}
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-800">
            Dashboard
          </h1>
          <p className="text-gray-600">
            {userRole === 'admin' 
              ? 'Beheerdersdashboard' 
              : userRole === 'specialist' 
                ? 'Specialistendashboard' 
                : 'Welkom bij FibroGuardian Pro'}
          </p>
        </header>

        {/* Render different dashboard content based on user role */}
        {userRole === 'patient' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section id="daily-planner" className="lg:col-span-2">
                <DailyPlannerContainer />
              </section>

              <section id="health-metrics">
                <HealthMetrics logs={logsData} />
              </section>
            </div>

            <section id="ai-insights" className="mt-8">
              <AIInsightsContainer initialInsightsProp={insightsData} />
            </section>

            <section id="quick-actions" className="mt-8">
              <QuickActions />
            </section>

            <DashboardClient userRole={userRole} />
          </>
        )}

        {userRole === 'specialist' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section id="patient-insights" className="lg:col-span-2">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold mb-4">Recente Patiënt Inzichten</h2>
                  {insightsData.length > 0 ? (
                    <div className="space-y-4">
                      {insightsData.map((insight, index) => (
                        <div key={index} className="border-l-4 border-purple-500 pl-4 py-2">
                          <p className="text-gray-700">{insight.beschrijving}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(String(insight.created_at)).toLocaleDateString('nl-NL')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Geen recente inzichten beschikbaar.</p>
                  )}
                </div>
              </section>
              
              <section id="specialist-quick-actions">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold mb-4">Snelle Acties</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a href="/specialisten/patienten" className="bg-purple-100 hover:bg-purple-200 p-4 rounded-lg flex items-center">
                      <span className="text-purple-800 font-medium">Patiënten Bekijken</span>
                    </a>
                    <a href="/specialisten/taken" className="bg-blue-100 hover:bg-blue-200 p-4 rounded-lg flex items-center">
                      <span className="text-blue-800 font-medium">Taken Toewijzen</span>
                    </a>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}

        {userRole === 'admin' && (
          <>
            <section id="admin-stats" className="mb-8">
              <AdminStatsCards stats={statsData} />
            </section>

            <section id="recent-users" className="mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Recente Gebruikers</h2>
                <RecentUsersTable users={recentUsersData} />
              </div>
            </section>

            <section id="admin-quick-actions">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Beheerder Acties</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <a href="/admin/users" className="bg-purple-100 hover:bg-purple-200 p-4 rounded-lg flex items-center">
                    <span className="text-purple-800 font-medium">Gebruikersbeheer</span>
                  </a>
                  <a href="/admin/subscriptions" className="bg-blue-100 hover:bg-blue-200 p-4 rounded-lg flex items-center">
                    <span className="text-blue-800 font-medium">Abonnementenbeheer</span>
                  </a>
                  <a href="/admin/statistics" className="bg-green-100 hover:bg-green-200 p-4 rounded-lg flex items-center">
                    <span className="text-green-800 font-medium">Statistieken</span>
                  </a>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
