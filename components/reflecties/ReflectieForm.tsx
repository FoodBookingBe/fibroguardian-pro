'use client';
import { useState, FormEvent, ChangeEvent } from 'react'; // Added ChangeEvent
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
// Assuming ErrorAlert is part of error-handler or a separate component
// For now, I'll use a simple error display. If ErrorAlert is a specific component, it needs to be created.
import { handleSupabaseError } from '@/lib/error-handler';
import { getSupabaseBrowserClient } from '@/lib/supabase';

type Stemming = 'zeer goed' | 'goed' | 'neutraal' | 'matig' | 'slecht' | 'zeer slecht';

interface ErrorAlertProps { // Basic ErrorAlert prop, adjust if ErrorAlert component is more complex
  error: { userMessage: string, technicalMessage?: string, action?: string } | string | null;
}

// Basic ErrorAlert component if not defined elsewhere
const ErrorAlert = ({ error }: ErrorAlertProps) => {
  if (!error) return null;
  const message = typeof error === 'string' ? error : error.userMessage;
  return <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">{message}</div>;
};


export default function ReflectieForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ReturnType<typeof handleSupabaseError> | null>(null);
  
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
      case 'matig': return 'bg-yellow-400 text-black'; // Adjusted for better contrast
      case 'slecht': return 'bg-orange-500 text-white';
      case 'zeer slecht': return 'bg-red-500 text-white';
      default: return 'bg-gray-200 text-gray-700';
    }
  };
  
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReflectieData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleStemmingSelect = (stemming: Stemming) => {
    setReflectieData(prev => ({ ...prev, stemming }));
  };
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (!user) throw new Error('Niet ingelogd. Log opnieuw in om uw reflectie op te slaan.');
      
      if (!reflectieData.datum) {
        setError({ userMessage: 'Datum is verplicht.', technicalMessage: 'Datum field is empty.'});
        setLoading(false);
        return;
      }
      
      const supabase = getSupabaseBrowserClient(); // Get client instance
      const { data: bestaandeReflectie, error: checkError } = await supabase
        .from('reflecties')
        .select('id')
        .eq('user_id', user.id)
        .eq('datum', reflectieData.datum)
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 (0 rows) is fine for insert
        throw checkError;
      }
      
      let resultaat;
      const dataToUpsert = {
        user_id: user.id,
        datum: reflectieData.datum,
        stemming: reflectieData.stemming,
        notitie: reflectieData.notitie,
        updated_at: new Date().toISOString(), // Always set updated_at
      };
      
      if (bestaandeReflectie) {
        resultaat = await supabase
          .from('reflecties')
          .update(dataToUpsert)
          .eq('id', bestaandeReflectie.id)
          .select() // Select to get the updated row back
          .single();
      } else {
        resultaat = await supabase
          .from('reflecties')
          .insert([{ ...dataToUpsert, created_at: new Date().toISOString() }])
          .select()
          .single();
      }
      
      if (resultaat.error) throw resultaat.error;
      
      router.push('/reflecties'); // Navigate to overview
      router.refresh(); // Refresh server components on that page
    } catch (err: any) { // Catch any type for error
      console.error('Fout bij opslaan reflectie:', err);
      setError(handleSupabaseError(err, 'reflectie-opslaan'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <section className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto"> {/* Added max-width */}
      <h2 className="text-xl font-semibold mb-6 text-gray-800">
        Dagelijkse Reflectie
      </h2>
      
      {error && <ErrorAlert error={error} />}
      
      <form onSubmit={handleSubmit} className="space-y-6"> {/* Added space-y */}
        <div>
          <label htmlFor="datum" className="block text-sm font-medium text-gray-700 mb-1">
            Datum
          </label>
          <input
            type="date"
            id="datum"
            name="datum"
            value={reflectieData.datum}
            onChange={handleChange}
            max={vandaag} // Prevent future dates
            className="form-input" // Using global style
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Selecteer de datum voor deze reflectie.
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hoe voelt u zich vandaag?
          </label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Stemming selectie">
            {stemmingOpties.map((stemming) => (
              <button
                key={stemming}
                type="button"
                onClick={() => handleStemmingSelect(stemming)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                  reflectieData.stemming === stemming
                    ? stemmingKleur(stemming)
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                role="radio"
                aria-checked={reflectieData.stemming === stemming ? "true" : "false"}
                aria-label={`Selecteer stemming: ${stemming}`}
              >
                {stemming.charAt(0).toUpperCase() + stemming.slice(1)} {/* Capitalize */}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label htmlFor="notitie" className="block text-sm font-medium text-gray-700 mb-1">
            Reflectie notitie
          </label>
          <textarea
            id="notitie"
            name="notitie"
            value={reflectieData.notitie}
            onChange={handleChange}
            rows={5}
            placeholder="Schrijf hier uw reflectie voor vandaag. Hoe voelt u zich? Wat ging er goed? Wat was moeilijk?"
            className="form-input" // Using global style
          ></textarea>
          <p className="mt-1 text-xs text-gray-500">
            Dagelijkse reflecties helpen om inzicht te krijgen in uw patronen.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200"> {/* Added border-t */}
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary" // Using global style
            disabled={loading}
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} // Using global style
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Opslaan...
              </span>
            ) : (
              'Opslaan'
            )}
          </button>
        </div>
      </form>
    </section>
  );
}