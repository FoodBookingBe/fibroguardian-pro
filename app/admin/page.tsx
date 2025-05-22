import React from 'react';

import { AdminStatsCards, RecentUsersTable } from '@/components/admin/DynamicAdminComponents';
import { getSupabaseServerComponentClient } from '@/lib/supabase-server';
import { Profile } from '@/types';

// Ensure consistent casing for Supabase table/column names if needed
// For example, if your tables are 'Tasks' not 'tasks', adjust accordingly.
// Based on schema.sql, names are lowercase.

// Next.js config option for dynamic data
export const dynamic = 'force-dynamic'; // Ensure fresh data on each request

export default async function AdminDashboardPage() {
  const supabase = getSupabaseServerComponentClient();
  
  // Fetch basic stats
  // Note: Supabase count returns { count: number | null, data: null, error: null }
  // or { count: null, data: PostgrestResponse['data'], error: PostgrestError | null }
  // We should handle potential errors for each query.
  
  let totalUsers = 0;
  let totalTasks = 0;
  let totalLogs = 0;
  let recentUsers: Profile[] = [];

  try {
    const usersQuery = await supabase.from('profiles').select('id', { count: 'exact', head: true });
    if (usersQuery.error) throw usersQuery.error;
    totalUsers = usersQuery.count || 0;

    const tasksQuery = await supabase.from('tasks').select('id', { count: 'exact', head: true });
    if (tasksQuery.error) throw tasksQuery.error;
    totalTasks = tasksQuery.count || 0;

    const logsQuery = await supabase.from('task_logs').select('id', { count: 'exact', head: true });
    if (logsQuery.error) throw logsQuery.error;
    totalLogs = logsQuery.count || 0;
    
    // Fetch recent users (for table)
    const { data: usersData, error: recentUsersError } = await supabase
      .from('profiles')
      .select('*') // Select all profile fields
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (recentUsersError) throw recentUsersError;
    recentUsers = (usersData as Profile[]) || [];

  } catch (error: unknown) {
    console.error("[AdminDashboardPage] Error fetching dashboard data:", 
      error instanceof Error ? error.message : 'Unknown error');
    // Optionally, render an error state or pass error to components
  }
   
  const stats = {
    totalUsers,
    totalTasks,
    totalLogs,
  };
   
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Admin Dashboard</h1> {/* Enhanced title */}
      <AdminStatsCards stats={stats} />
      
      <div className="mt-10 bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6"> {/* Enhanced section styling */}
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Recente Gebruikers</h2>
        <RecentUsersTable users={recentUsers} />
      </div>
    </div>
  );
}
