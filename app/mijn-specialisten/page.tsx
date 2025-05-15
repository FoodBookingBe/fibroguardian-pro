import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AddSpecialistButton from '@/components/specialisten/AddSpecialistButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching

export default async function MijnSpecialistenPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Controleer of gebruiker is ingelogd
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.log('No session found, redirecting to login');
    return redirect('/auth/login');
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
    return redirect('/dashboard?error=profile_not_found');
  }
  
  // Controleer of gebruiker een patiënt is
  if (profile.type !== 'patient') {
    return redirect('/dashboard?error=not_patient');
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mijn Specialisten</h1>
        <AddSpecialistButton />
      </div>

      {specialists.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 mb-4">U heeft nog geen specialisten toegevoegd.</p>
          <p className="text-gray-500">
            Gebruik de knop "Specialist Toevoegen" om een specialist toe te voegen aan uw account.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialists.map(specialist => (
            <div key={specialist.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {specialist.voornaam} {specialist.achternaam}
                </h2>
                <p className="text-gray-600 mb-4">{specialist.email}</p>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Toegangsrechten:</h3>
                  <ul className="text-sm text-gray-600">
                    {specialist.toegangsrechten.includes('view_tasks') && (
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Kan uw taken bekijken
                      </li>
                    )}
                    {specialist.toegangsrechten.includes('view_logs') && (
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Kan uw logs bekijken
                      </li>
                    )}
                    {specialist.toegangsrechten.includes('create_tasks') && (
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Kan taken voor u aanmaken
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
