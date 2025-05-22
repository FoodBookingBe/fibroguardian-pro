import React from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { SpecialistIntelligenceDashboardComponent } from '@/components/specialisten/DynamicSpecialistComponents';
import { getSupabaseServerComponentClient } from '@/lib/supabase-server';

/**
 * Specialist Intelligence Dashboard page
 * Provides AI-driven insights for specialists to better manage their patients
 */
export default async function SpecialistIntelligencePage() {
  const supabase = getSupabaseServerComponentClient();
  
  // Get user data
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('Specialist Intelligence Page: User not found or error fetching user.', userError);
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
  
  // Only specialists and admins can access this page
  if (profile.type !== 'specialist' && profile.type !== 'admin') {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="rounded-lg bg-red-50 p-4 text-red-800">
            <h2 className="text-lg font-medium">Toegang geweigerd</h2>
            <p>U heeft geen toegang tot deze pagina. Deze pagina is alleen toegankelijk voor specialisten en beheerders.</p>
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
            AI Inzichten Dashboard
          </h1>
          <p className="text-gray-600">
            Geavanceerde analyses en voorspellingen voor uw patiënten
          </p>
        </header>
        
        <div className="grid grid-cols-1 gap-6">
          <SpecialistIntelligenceDashboardComponent />
        </div>
      </div>
    </DashboardLayout>
  );
}
