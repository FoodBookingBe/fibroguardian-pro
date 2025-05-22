import React from 'react';

import { redirect } from 'next/navigation';
import { getSupabaseServerComponentClient } from '@/lib/supabase-server';
import { ReactNode } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout'; // Import the main DashboardLayout

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = getSupabaseServerComponentClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/auth/login');
    // return <></>; // Empty fragment instead of null // redirect() throws an error, so this is unreachable
  }
  
  // Fetch profile to check admin status
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('type')
    .eq('id', user.id)
    .single();
  
  // Redirect if not admin or profile error
  if (profileError || profile?.type !== 'admin') {
    // Log the error or profile type for debugging if needed
    if (profileError) console.error('[AdminLayout] Profile fetch error:', profileError.message);
    else console.warn(`[AdminLayout] User ${user.id} is not admin. Profile type: ${profile?.type}`);
    redirect('/dashboard'); // Redirect to a general dashboard or an "unauthorized" page
  }
  
  // If user is admin, render the children within the main DashboardLayout
  // The DashboardLayout's SidebarContainer will need to be aware of the admin role
  // to show appropriate admin navigation links.
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
