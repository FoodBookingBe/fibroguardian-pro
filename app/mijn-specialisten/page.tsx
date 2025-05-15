'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import AddSpecialistButton from '@/components/specialisten/AddSpecialistButton';
import Link from 'next/link';

interface Specialist {
  id: string;
  voornaam: string;
  achternaam: string;
  email: string;
  toegangsrechten: string[];
}

export default function MijnSpecialistenPage() {
  const { user } = useAuth();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpecialists = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const supabase = getSupabaseBrowserClient();

        // Controleer of de gebruiker een patiënt is
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('type')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        if (profileData.type !== 'patient') {
          throw new Error('Alleen patiënten kunnen hun specialisten bekijken');
        }

        // Haal de specialist-patiënt relaties op
        const { data: relationData, error: relationError } = await supabase
          .from('specialist_patienten')
          .select('specialist_id, toegangsrechten')
          .eq('patient_id', user.id);

        if (relationError) throw relationError;
        if (!relationData || relationData.length === 0) {
          setSpecialists([]);
          return;
        }

        // Haal de gegevens van de specialisten op
        const specialistIds = relationData.map(rel => rel.specialist_id);
        const { data: specialistsData, error: specialistsError } = await supabase
          .from('profiles')
          .select('id, voornaam, achternaam, email')
          .in('id', specialistIds);

        if (specialistsError) throw specialistsError;

        // Combineer de gegevens
        const specialistsWithAccess = specialistsData.map(specialist => {
          const relation = relationData.find(rel => rel.specialist_id === specialist.id);
          return {
            ...specialist,
            toegangsrechten: relation?.toegangsrechten || []
          };
        });

        setSpecialists(specialistsWithAccess);
      } catch (err: any) {
        console.error('Error fetching specialists:', err);
        setError(err.message || 'Er is een fout opgetreden bij het ophalen van specialisten');
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialists();
  }, [user]);

  const handleRemoveSpecialist = async (specialistId: string) => {
    if (!user || !window.confirm('Weet u zeker dat u deze specialist wilt verwijderen?')) return;

    try {
      const supabase = getSupabaseBrowserClient();
      
      const { error } = await supabase
        .from('specialist_patienten')
        .delete()
        .eq('specialist_id', specialistId)
        .eq('patient_id', user.id);

      if (error) throw error;

      // Update de lijst met specialisten
      setSpecialists(specialists.filter(s => s.id !== specialistId));
    } catch (err: any) {
      console.error('Error removing specialist:', err);
      alert(`Er is een fout opgetreden: ${err.message}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>U moet ingelogd zijn om deze pagina te bekijken.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mijn Specialisten</h1>
        <AddSpecialistButton />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : specialists.length === 0 ? (
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
                
                <div className="flex justify-end">
                  <button
                    onClick={() => handleRemoveSpecialist(specialist.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Verwijderen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
