import DashboardLayout from '@/components/layout/DashboardLayout';
import PatientList from '@/components/specialisten/PatientList';
import AddPatientButton from '@/components/specialisten/AddPatientButton';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function PatientenPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null; // DashboardLayout handles redirect
  }
  
  // Haal patiënten op voor deze specialist
  const { data: specialistPatients } = await supabase
    .from('specialist_patienten')
    .select('patient_id')
    .eq('specialist_id', session.user.id);
  
  let patients = [];
  
  if (specialistPatients && specialistPatients.length > 0) {
    const patientIds = specialistPatients.map((sp: { patient_id: string }) => sp.patient_id);
    
    // Haal patiëntprofielen op
    const { data: patientsData } = await supabase
      .from('profiles')
      .select('*')
      .in('id', patientIds);
    
    patients = patientsData || [];
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-800">Mijn Patiënten</h1>
          <AddPatientButton />
        </div>
        
        <PatientList patients={patients} />
      </div>
    </DashboardLayout>
  );
}