import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import MijnSpecialistenClient from './mijn-specialisten-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching

export default async function MijnSpecialistenPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Haal gebruikerssessie op - middleware zorgt al voor authenticatie
  // Use getUser() instead of getSession() for server components
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  // Log session information for debugging
  console.log('[Server] MijnSpecialistenPage user check:', {
    hasUser: !!user,
    error: userError?.message
  });
  
  if (!user) {
    // Dit zou niet moeten gebeuren door middleware, maar voor de zekerheid
    console.log('[Server] No user found despite middleware check');
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">U bent niet ingelogd. <a href="/auth/login" className="underline">Log in</a> om deze pagina te bekijken.</p>
        </div>
      </div>
    );
  }
  
  // Haal gebruikersprofiel op
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError);
    // Toon een foutmelding in plaats van redirect
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">Er is een fout opgetreden bij het ophalen van uw profiel.</p>
        </div>
      </div>
    );
  }
  
  // Controleer of gebruiker een patiënt is
  if (profile.type !== 'patient') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 p-4 rounded-md">
          <p className="text-yellow-700">Deze pagina is alleen beschikbaar voor patiënten.</p>
        </div>
      </div>
    );
  }
  
  // Haal de specialist-patiënt relaties op
  const { data: relationData, error: relationError } = await supabase
    .from('specialist_patienten')
    .select('specialist_id, toegangsrechten')
    .eq('patient_id', user.id);
  
  if (relationError) {
    console.error('Error fetching specialist relations:', relationError);
    // Ga door met lege lijst
  }
  
  interface Specialist {
    id: string;
    voornaam: string;
    achternaam: string;
    email: string;
    toegangsrechten: string[];
  }
  
  let specialists: Specialist[] = [];
  
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
  
  // Gebruik de client component om de UI te renderen
  return <MijnSpecialistenClient user={user} specialists={specialists} userProfile={profile} />;
}
