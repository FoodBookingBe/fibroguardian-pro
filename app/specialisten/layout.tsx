import React from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { getSupabaseServerComponentClient } from '@/lib/supabase-server';

export default async function SpecialistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = getSupabaseServerComponentClient();
  
  // Get user data
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('Specialist Layout: User not found or error fetching user.', userError);
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
  
  // Only specialists and admins can access this section
  if (profile.type !== 'specialist' && profile.type !== 'admin') {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="rounded-lg bg-red-50 p-4 text-red-800">
            <h2 className="text-lg font-medium">Toegang geweigerd</h2>
            <p>U heeft geen toegang tot deze sectie. Deze sectie is alleen toegankelijk voor specialisten en beheerders.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Specialist Navigation */}
        <div className="mb-6 border-b border-gray-200 pb-4">
          <nav className="flex space-x-4">
            <a 
              href="/specialisten/patienten" 
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-purple-100 hover:text-purple-700"
            >
              Patiënten
            </a>
            <a 
              href="/specialisten/taken" 
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-purple-100 hover:text-purple-700"
            >
              Taken
            </a>
            <a 
              href="/specialisten/inzichten" 
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-purple-100 hover:text-purple-700"
            >
              Inzichten
            </a>
            <a 
              href="/specialisten/kennisbank" 
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-purple-100 hover:text-purple-700"
            >
              Kennisbank
            </a>
          </nav>
        </div>
        
        {children}
      </div>
    </DashboardLayout>
  );
}
