import React from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import PatientList from '@/components/specialisten/PatientList';
import AddPatientButtonContainer from '@/containers/specialisten/AddPatientButtonContainer'; // Updated import
// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'; // Old import
// import { cookies } from 'next/headers'; // Handled by centralized client
import { getSupabaseServerComponentClient } from '@/lib/supabase-server'; // Corrected import path
import { Profile } from '@/types'; // Import Profile type

export default async function PatientenPage() {
  const supabase = getSupabaseServerComponentClient(); // Use centralized server client
  
  // Check authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser(); // Use getUser
  
  if (userError || !user) {
    console.error('PatientenPage: User not found or error fetching user.', userError);
    return <></>; // Empty fragment instead of null // DashboardLayout should handle redirect if not authenticated
  }
  
  // Haal patiënten op voor deze specialist
  const { data: specialistPatients, error: spError } = await supabase
    .from('specialist_patienten')
    .select('patient_id')
    .eq('specialist_id', user.id); // Use user.id
  
  console.log('[PatientenPage] Specialist ID:', user.id);
  if (spError) console.error('[PatientenPage] Error fetching specialist_patienten:', spError);
  console.log('[PatientenPage] Fetched specialistPatients links:', specialistPatients);

  let patients: Profile[] = []; // Explicitly type patients
  
  if (specialistPatients && specialistPatients.length > 0) {
    const patientIds = specialistPatients.map((sp: { patient_id: string }) => sp.patient_id);
    console.log('[PatientenPage] Patient IDs to fetch profiles for:', patientIds);
    
    // Haal patiëntprofielen op
    const { data: patientsData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', patientIds);
    
    if (profilesError) console.error('[PatientenPage] Error fetching patient profiles:', profilesError);
    console.log('[PatientenPage] Fetched patientsData:', patientsData);
    
    patients = patientsData || [];
  } else {
    console.log('[PatientenPage] No specialistPatients links found or specialistPatients is null/empty.');
  }
  console.log('[PatientenPage] Final patients array for PatientList:', patients);
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-800">Mijn Patiënten</h1>
          <AddPatientButtonContainer /> {/* Updated component */}
        </div>
        
        <PatientList patients={patients} />
      </div>
    </DashboardLayout>
  );
}
// Removed accidental 'div' text if any was present
