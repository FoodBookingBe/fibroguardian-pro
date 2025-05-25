
// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'; // Old way
// import { cookies } from 'next/headers'; // Handled by getSupabaseServerComponentClient
import { getSupabaseServerComponentClient } from '@/lib/supabase-server'; // New way
import MijnSpecialistenClient from './mijn-specialisten-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching

export default async function MijnSpecialistenPage() {
  const supabase = getSupabaseServerComponentClient(); // Use the new helper

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
  if (!profile || profile.type !== 'patient') {
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

  let specialistsProps: import('@/types').Profile[] = [];

  if (relationData && relationData.length > 0) {
    const specialistIds = relationData.map(rel => rel.specialist_id);
    if (specialistIds.length > 0) {
      const { data: fetchedProfiles, error: specialistsError } = await supabase
        .from('profiles')
        .select('id, voornaam, achternaam, email, type, avatar_url, postcode, gemeente, geboortedatum, created_at, updated_at') // Ensure all Profile fields
        .in('id', specialistIds)
        .eq('type', 'specialist');

      if (!specialistsError && fetchedProfiles) {
        specialistsProps = fetchedProfiles.map(p => ({
          ...p,
          geboortedatum: p.geboortedatum ? new Date(p.geboortedatum) : undefined,
          // The `toegangsrechten` is specific to the relation, not the profile itself.
          // MijnSpecialistenClient will need to handle this if it needs that data.
          // For now, ensure `specialistsProps` is strictly Profile[].
        }));
      } else if (specialistsError) {
        console.error('Error fetching specialist profiles:', specialistsError);
      }
    }
  }

  // Gebruik de client component om de UI te renderen
  // Note: `MijnSpecialistenClient` imports `Profile as Specialist`, so `specialistsProps` (which is Profile[]) is compatible.
  return <MijnSpecialistenClient user={user} specialists={specialistsProps} userProfile={profile} />;
}
