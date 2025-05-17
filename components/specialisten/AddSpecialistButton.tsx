'use client';
import { useState, FormEvent } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase'; // Still needed for profile lookup
import { useAuth } from '@/components/auth/AuthProvider';
import { useAddSpecialistPatientRelation } from '@/hooks/useMutations';
import { useNotification } from '@/context/NotificationContext';
import { AlertMessage } from '@/components/common/AlertMessage'; // For inline form errors
import { ErrorMessage } from '@/lib/error-handler';

export default function AddSpecialistButton() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null); // For form-specific validation before calling mutation

  const { addNotification } = useNotification();
  const { 
    mutate: addRelation, 
    isPending: isAddingRelation,
    // error: mutationError, // Handled by addNotification in onError
    // isError: isMutationError // Handled by addNotification in onError
  } = useAddSpecialistPatientRelation();
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!user) {
      setFormError("U moet ingelogd zijn om een specialist toe te voegen.");
      return;
    }
    if (!email.trim()) {
      setFormError("E-mailadres van specialist is verplicht.");
      return;
    }

    // Client-side lookup for specialist ID by email.
    // This could also be an API route for better separation.
    const supabaseClient = getSupabaseBrowserClient();
    try {
      // 1. Verify current user is a patient
      const { data: currentUserProfile, error: currentUserError } = await supabaseClient
        .from('profiles')
        .select('type')
        .eq('id', user.id)
        .single();

      if (currentUserError) throw currentUserError;
      if (currentUserProfile?.type !== 'patient') {
        setFormError('Alleen patiënten kunnen specialisten toevoegen.');
        return;
      }

      // 2. Find specialist by email
      const { data: specialistData, error: specialistLookupError } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('email', email)
        .eq('type', 'specialist')
        .single();

      if (specialistLookupError || !specialistData) {
        setFormError('Geen specialist gevonden met dit e-mailadres.');
        return;
      }
      const specialistIdToAdd = specialistData.id;

      // 3. Call the mutation hook
      addRelation({ specialist_id_to_add: specialistIdToAdd }, {
        onSuccess: () => {
          addNotification({ type: 'success', message: 'Specialist succesvol toegevoegd!' });
          setShowModal(false);
          setEmail('');
          // Consider if reload is truly needed or if cache invalidation is enough
          // For now, removing reload to rely on React Query's cache mechanisms.
          // queryClient.invalidateQueries({ queryKey: ['mySpecialists', user.id] }); // Done by hook
        },
        onError: (error: ErrorMessage) => {
          // Error message from API/hook is shown via notification
          addNotification({ type: 'error', message: error.userMessage || 'Fout bij toevoegen specialist.' });
        }
      });

    } catch (err: any) {
      console.error('Error in AddSpecialistButton handleSubmit:', err);
      setFormError(err.message || 'Er is een onverwachte fout opgetreden.');
      addNotification({ type: 'error', message: err.message || 'Er is een onverwachte fout opgetreden.' });
    }
  };
  
  return (
    <>
      <button
        onClick={() => {
          setShowModal(true);
          setEmail('');
          setFormError(null);
        }}
        className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
      >
        Specialist Toevoegen
      </button>
      
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Specialist Toevoegen</h3>
              
              {formError && (
                <AlertMessage type="error" message={formError} className="mb-4" />
              )}
              {/* Global notifications will handle success/error from the mutation hook */}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="specialist-email" className="block text-sm font-medium text-gray-700 mb-1">
                    E-mailadres van specialist
                  </label>
                  <input
                    id="specialist-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${formError && email === '' ? 'border-red-500' : 'border-gray-300'}`}
                    required
                    disabled={isAddingRelation}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Voer het e-mailadres in waarmee de specialist is geregistreerd.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={isAddingRelation}
                  >
                    Annuleren
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isAddingRelation}
                    className={`px-4 py-2 rounded-md text-white font-medium ${
                      isAddingRelation ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                    } transition-colors`}
                  >
                    {isAddingRelation ? 'Bezig...' : 'Toevoegen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
