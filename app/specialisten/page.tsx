import React from 'react';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import PatientList from '@/components/specialisten/PatientList';
import Link from 'next/link';
import { Profile } from '@/types';

export default async function SpecialistenDashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options} // Type assertion fixed
const typedOptions = options as Record<string, unknown> ;);
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options} // Type assertion fixed
const typedOptions = options as Record<string, unknown> ;);
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch profile to confirm specialist type
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('type, voornaam')
    .eq('id', user.id)
    .single<Profile>();

  if (profileError || !profile) {
    console.error('Error fetching specialist profile:', profileError?.message);
    // Redirect to general dashboard or an error page if profile is crucial and not found
    redirect('/dashboard?error=profile_not_found'); 
  }

  if (profile.type !== 'specialist') {
    // This should ideally be caught by middleware as well
    console.warn(`User ${user.id} attempted to access specialist page but is type ${profile.type}`);
    redirect('/dashboard?error=unauthorized_specialist_access');
  }

  // Fetch patients for the specialist (example, adjust as per your actual schema)
  // This is a simplified query. You'll need to adjust this based on how specialists are linked to patients.
  // For example, if patients have an 'assigned_specialist_id' field:
  // .eq('assigned_specialist_id', user.id)
  const { data: patientsData, error: patientsError } = await supabase
    .from('profiles')
    .select('*')
    .eq('type', 'patient'); // Fetches all profiles of type 'patient'

  if (patientsError) {
    console.error('Error fetching patients for specialist:', patientsError.message);
  }
  const patients: Profile[] = patientsData || [];

  return (
    <div className="container mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-800">
          Specialisten Dashboard - Welkom {profile.voornaam || 'Specialist'}
        </h1>
        <p className="text-gray-600">Overzicht van uw patiënten en activiteiten.</p>
      </header>

      <nav className="mb-6">
        <ul className="flex space-x-4">
          <li><Link href="/specialisten" className="text-purple-600 hover:underline">Patiënten Overzicht</Link></li>
          <li><Link href="/opdrachten" className="text-purple-600 hover:underline">Opdrachten Beheer</Link></li>
          {/* Add more specialist-specific navigation links here */}
        </ul>
      </nav>

      <section id="patient-list">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Mijn Patiënten</h2>
        <PatientList patients={patients} />
        {/* Removed comment as patients prop is now passed */}
        {patientsError && <p className="text-red-500">Fout bij het laden van patiënten: {patientsError.message}</p>}
        {patients.length === 0 && !patientsError && <p>Geen patiënten gevonden.</p>}
      </section>
      
      {/* Placeholder for other specialist modules */}
      <section id="therapy-adherence-stats" className="mt-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Therapietrouw Statistieken</h2>
        <p>Statistieken over therapietrouw komen hier.</p>
      </section>

      <section id="specialist-reporting" className="mt-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Rapportage Inzichten (Specialist)</h2>
        <p>Specifieke rapportage-inzichten voor specialisten komen hier.</p>
      </section>

      <section id="patient-communication" className="mt-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Communicatie met Patiënten</h2>
        <p>Tools voor communicatie met patiënten komen hier.</p>
      </section>
    </div>
  );
}