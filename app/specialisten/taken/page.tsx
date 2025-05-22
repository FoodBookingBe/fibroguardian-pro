import React from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { getSupabaseServerComponentClient } from '@/lib/supabase-server';
import { Profile } from '@/types';
import { notFound } from 'next/navigation';
// Link wordt nu gebruikt in SpecialistTaskCreator
// import Link from 'next/link'; 
import SpecialistTaskCreator from '@/components/specialisten/SpecialistTaskCreator'; // Import de nieuwe client component

export default async function SpecialistTakenPage() {
  const supabase = getSupabaseServerComponentClient();

  const { data: { user: specialistUser }, error: specialistUserError } = await supabase.auth.getUser();

  if (specialistUserError || !specialistUser) {
    // Dit zou door middleware afgehandeld moeten worden, maar als extra check
    return notFound(); 
  }

  // Haal de lijst van patiënten van de specialist op
  const { data: specialistPatientsLinks, error: linksError } = await supabase
    .from('specialist_patienten')
    .select('patient_id')
    .eq('specialist_id', specialistUser.id);

  if (linksError) {
    console.error('[SpecialistTakenPage] Error fetching specialist_patienten links:', linksError);
    // Overweeg een foutmelding te tonen aan de gebruiker
  }

  let patients: Profile[] = [];
  if (specialistPatientsLinks && specialistPatientsLinks.length > 0) {
    const patientIds = specialistPatientsLinks.map(link => link.patient_id);
    const { data: patientsData, error: patientsError } = await supabase
      .from('profiles')
      .select('id, voornaam, achternaam, email') // Selecteer alleen benodigde velden voor de lijst
      .in('id', patientIds)
      .eq('type', 'patient'); 
    
    if (patientsError) {
      console.error('[SpecialistTakenPage] Error fetching patient profiles:', patientsError);
    } else if (patientsData) {
      patients = patientsData as Profile[];
    }
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-800">
            Taken Toewijzen aan Patiënten
          </h1>
        </header>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-700 mb-4">
            Selecteer een patiënt en maak een nieuwe taak aan of wijs een bestaande taak toe.
          </p>
          
          <SpecialistTaskCreator patients={patients} specialistId={specialistUser.id} />

        </div>
      </div>
    </DashboardLayout>
  );
}
