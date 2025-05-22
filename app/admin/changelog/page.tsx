import React from 'react';

import ChangelogViewer from '@/components/admin/ChangelogViewer';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getSupabaseServerComponentClient } from '@/lib/supabase-server';

/**
 * Admin Changelog Page
 * Displays a filterable view of all system changes
 */
export default async function AdminChangelogPage() {
  const supabase = getSupabaseServerComponentClient();
  
  // Get user data
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('Admin Changelog Page: User not found or error fetching user.', userError);
    return <></>; // Empty fragment instead of null
  }
  
  // Fetch user profile to determine role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    return <></>; // Empty fragment instead of null
  }
  
  // Only admins can access this page
  if (profile.type !== 'admin') {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="rounded-lg bg-red-50 p-4 text-red-800">
            <h2 className="text-lg font-medium">Toegang geweigerd</h2>
            <p>U heeft geen toegang tot deze pagina. Deze pagina is alleen toegankelijk voor beheerders.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-800">
            Systeem Changelog
          </h1>
          <p className="text-gray-600">
            Overzicht van alle wijzigingen aan het FibroGuardian Pro systeem
          </p>
        </header>
        
        <ChangelogViewer />
      </div>
    </DashboardLayout>
  );
}
