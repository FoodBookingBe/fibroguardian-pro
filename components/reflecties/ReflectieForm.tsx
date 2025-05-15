'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase'; // Corrected import

interface ReflectieFormProps {
  reflectieId?: string;
}

type Stemming = 'zeer goed' | 'goed' | 'neutraal' | 'matig' | 'slecht' | 'zeer slecht';

export default function ReflectieForm({ reflectieId }: ReflectieFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const vandaag = new Date().toISOString().split('T')[0];
  
  const [reflectieData, setReflectieData] = useState({
    datum: vandaag,
    stemming: 'neutraal' as Stemming,
    notitie: '',
  });
  
  const stemmingOpties: Stemming[] = [
    'zeer goed',
    'goed',
    'neutraal',
    'matig',
    'slecht',
    'zeer slecht'
  ];

  const stemmingKleur = (stemming: Stemming) => {
    switch (stemming) {
      case 'zeer goed': return 'bg-green-500 text-white';
      case 'goed': return 'bg-green-400 text-white';
      case 'neutraal': return 'bg-blue-400 text-white';
      case 'matig': return 'bg-yellow-400 text-white';
      case 'slecht': return 'bg-orange-500 text-white';
      case 'zeer slecht': return 'bg-red-500 text-white';
      default: return 'bg-gray-200 text-gray-700';
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReflectieData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleStemmingSelect = (stemming: Stemming) => {
    setReflectieData(prev => ({ ...prev, stemming }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const supabaseClient = getSupabaseBrowserClient(); // Corrected usage
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (!user) throw new Error('Niet ingelogd');
      
      // Validatie
      if (!reflectieData.datum) {
        throw new Error('Datum is verplicht');
      }
      
      // Controleer of er al een reflectie is voor deze datum
      const { data: bestaandeReflectie, error: checkError } = await supabaseClient
        .from('reflecties')
        .select('id')
        .eq('user_id', user.id)
        .eq('datum', reflectieData.datum)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      let resultaat;
      
      if (bestaandeReflectie || reflectieId) {
        // Update bestaande reflectie
        const id = reflectieId || bestaandeReflectie?.id;
        
        resultaat = await supabaseClient
          .from('reflecties')
          .update({
            stemming: reflectieData.stemming,
            notitie: reflectieData.notitie,
          })
          .eq('id', id);
      } else {
        // Voeg nieuwe reflectie toe
        resultaat = await supabaseClient
          .from('reflecties')
          .insert([{
            user_id: user.id,
            datum: reflectieData.datum,
            stemming: reflectieData.stemming,
            notitie: reflectieData.notitie,
          }]);
      }
      
      if (resultaat.error) throw resultaat.error;
      
      // Terug naar reflecties overzicht
      router.push('/reflecties');
    } catch (error: any) {
      console.error('Fout bij opslaan reflectie:', error);
      setError(error.message || 'Er is een fout opgetreden bij het opslaan van de reflectie');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <section className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">
        Dagelijkse Reflectie
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Datum selector */}
        <div className="mb-5">
          <label htmlFor="datum" className="block text-gray-700 font-medium mb-2">
            Datum
          </label>
          <input
            type="date"
            id="datum"
            name="datum"
            value={reflectieData.datum}
            onChange={handleChange}
            max={vandaag}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Selecteer de datum voor deze reflectie
          </p>
        </div>
        
        {/* Stemming selector */}
        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-2">
            Hoe voelt u zich vandaag?
          </label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Stemming selectie">
            {stemmingOpties.map((stemming) => (
              <button
                key={stemming}
                type="button"
                onClick={() => handleStemmingSelect(stemming)}
                className={`px-4 py-2 rounded-md transition ${
                  reflectieData.stemming === stemming
                    ? stemmingKleur(stemming)
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                role="radio"
                aria-checked={reflectieData.stemming === stemming ? "true" : "false"}
                aria-label={`Selecteer stemming: ${stemming}`}
              >
                {stemming}
              </button>
            ))}
          </div>
        </div>
        
        {/* Notitie */}
        <div className="mb-5">
          <label htmlFor="notitie" className="block text-gray-700 font-medium mb-2">
            Reflectie
          </label>
          <textarea
            id="notitie"
            name="notitie"
            value={reflectieData.notitie}
            onChange={handleChange}
            rows={5}
            placeholder="Schrijf hier uw reflectie voor vandaag. Hoe voelt u zich? Wat ging er goed? Wat was moeilijk?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          ></textarea>
          <p className="mt-1 text-sm text-gray-500">
            Dagelijkse reflecties helpen om inzicht te krijgen in uw patronen
          </p>
        </div>
        
        {/* Submit knop */}
        <div className="flex justify-end space-x-3 mt-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              loading ? 'bg-purple-300' : 'bg-purple-600 hover:bg-purple-700'
            } transition-colors`}
          >
            {loading ? (
              <>
                <span className="animate-pulse">Opslaan...</span>
              </>
            ) : (
              'Opslaan'
            )}
          </button>
        </div>
      </form>
    </section>
  );
}