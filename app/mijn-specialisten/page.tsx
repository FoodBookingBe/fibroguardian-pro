import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MijnSpecialistenClient from './mijn-specialisten-client';

export const dynamic = 'force-dynamic';

export default async function MijnSpecialistenPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Controleer of gebruiker is ingelogd
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login');
  }
  
  // Haal gebruikersprofiel op
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError);
    // Redirect naar een foutpagina of dashboard
    redirect('/dashboard?error=profile_not_found');
  }
  
  // Controleer of gebruiker een patiënt is
  if (profile.type !== 'patient') {
    redirect('/dashboard?error=not_patient');
  }
  
  // Haal de specialist-patiënt relaties op
  const { data: relationData, error: relationError } = await supabase
    .from('specialist_patienten')
    .select('specialist_id, toegangsrechten')
    .eq('patient_id', session.user.id);
  
  if (relationError) {
    console.error('Error fetching specialist relations:', relationError);
    // Ga door met lege lijst
  }
  
  let specialists = [];
  
  if (relationData && relationData.length > 0) {
    // Haal de gegevens van de specialisten op
    const specialistIds = relationData.map(rel => rel.specialist_id);
    const { data: specialistsData, error: specialistsError } = await supabase
      .from('profiles')
      .select('id, voornaam, achternaam, email')
      .in('id', specialistIds);
    
    if (!specialistsError && specialistsData) {
      // Combineer de gegevens
      specialists = specialistsData.map(specialist => {
        const relation = relationData.find(rel => rel.specialist_id === specialist.id);
        return {
          ...specialist,
          toegangsrechten: relation?.toegangsrechten || []
        };
      });
    }
  }
  
  return (
    <div>
      <MijnSpecialistenClient 
        user={session.user}
        specialists={specialists}
        userProfile={profile}
      />
    </div>
  );
}
