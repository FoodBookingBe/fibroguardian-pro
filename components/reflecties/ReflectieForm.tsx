'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useUpsertReflectie } from '@/hooks/useMutations';
import { AlertMessage } from '@/components/common/AlertMessage';
import { Reflectie, ReflectieFormData } from '@/types'; 
import { ErrorMessage } from '@/lib/error-handler';
import { ariaProps, useFocusManagement } from '@/utils/accessibility'; // Import accessibility utils

interface ReflectieFormProps {
  initialDatum?: string; // YYYY-MM-DD
  // If editing a specific existing reflection, an ID might be passed
  // For now, this form handles upsert based on date for the logged-in user
}

type Stemming = 'zeer goed' | 'goed' | 'neutraal' | 'matig' | 'slecht' | 'zeer slecht';

export default function ReflectieForm({ initialDatum }: ReflectieFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  const vandaag = new Date().toISOString().split('T')[0];
  
  const [reflectieData, setReflectieData] = useState({
    datum: initialDatum || vandaag,
    stemming: 'neutraal' as Stemming,
    notitie: '',
  });

  const { 
    mutate: upsertReflectie, 
    isPending: isUpserting, 
    error: upsertHookError, // Renamed to avoid conflict with any local 'error' state if used
    isError: isUpsertError,
    isSuccess: isUpsertSuccess
  } = useUpsertReflectie();
  
  const stemmingOpties: Stemming[] = [
    'zeer goed', 'goed', 'neutraal', 'matig', 'slecht', 'zeer slecht'
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
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      console.error("User not authenticated for submitting reflection.");
      // Consider setting a local error state if not relying on hook's error
      return;
    }

    if (!reflectieData.datum) {
      console.error("Datum is verplicht voor reflectie.");
      // Set local error or rely on form validation
      return;
    }

    // Data for the API (which handles upsert logic based on user_id and datum)
    const dataToUpsert: ReflectieFormData = { // Use ReflectieFormData type
        datum: reflectieData.datum, 
        stemming: reflectieData.stemming,
        notitie: reflectieData.notitie,
    };
    
    upsertReflectie(dataToUpsert, {
      onSuccess: (savedReflectie) => {
        console.log('Reflectie saved:', savedReflectie);
        // Optionally show success message for a short duration before redirecting
        // For now, directly redirecting as per original logic.
        router.push('/reflecties');
      },
      onError: (error) => {
        // Error is available via upsertHookError from the useUpsertReflectie hook
        console.error('Fout bij opslaan reflectie (hook):', error.userMessage);
      }
    });
  };
  
  const typedUpsertError = upsertHookError as ErrorMessage | null;
  const submitButtonRef = useFocusManagement<HTMLButtonElement>(isUpsertError); // Focus submit button on error

  return (
    <section className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Dagelijkse Reflectie</h2>
      
      {isUpsertError && typedUpsertError && (
        <AlertMessage type="error" title="Opslaan Mislukt" message={typedUpsertError.userMessage || 'Opslaan van reflectie mislukt'} />
      )}
      {isUpsertSuccess && !isUpsertError && ( 
         <AlertMessage type="success" title="Succes" message="Reflectie succesvol opgeslagen!" />
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label htmlFor="datum" className="block text-gray-700 font-medium mb-2">Datum</label>
          <input
            type="date" id="datum" name="datum"
            value={reflectieData.datum} onChange={handleChange}
            max={vandaag} // Prevent future dates
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">Selecteer de datum voor deze reflectie</p>
        </div>
        
        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-2">Hoe voelt u zich vandaag?</label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Stemming selectie">
            {stemmingOpties.map((stemming) => (
              <button
                key={stemming} type="button" onClick={() => handleStemmingSelect(stemming)}
                className={`px-4 py-2 rounded-md transition ${
                  reflectieData.stemming === stemming
                    ? stemmingKleur(stemming)
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                {...ariaProps.checkbox(reflectieData.stemming === stemming)} // Using checkbox role for radio-like buttons
                aria-label={`Selecteer stemming: ${stemming}`}
              >
                {stemming}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-5">
          <label htmlFor="notitie" className="block text-gray-700 font-medium mb-2">Reflectie</label>
          <textarea
            id="notitie" name="notitie" value={reflectieData.notitie}
            onChange={handleChange} rows={5}
            placeholder="Schrijf hier uw reflectie voor vandaag. Hoe voelt u zich? Wat ging er goed? Wat was moeilijk?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          ></textarea>
          <p className="mt-1 text-sm text-gray-500">Dagelijkse reflecties helpen om inzicht te krijgen in uw patronen</p>
        </div>
        
        <div className="flex justify-end space-x-3 mt-8">
          <button
            type="button" onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isUpserting}
          >
            Annuleren
          </button>
          <button
            type="submit" disabled={isUpserting}
            ref={submitButtonRef} // Apply focus ref
            className={`px-4 py-2 rounded-md text-white font-medium ${
              isUpserting ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
            } transition-colors`}
          >
            {isUpserting ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </form>
    </section>
  );
}
