'use client';
import { useState, FormEvent } from 'react';
import { useAuth } from '@/components/auth/AuthProvider'; 
import { AlertMessage } from '@/components/common/AlertMessage';
import { useAddSpecialistPatientRelation } from '@/hooks/useMutations';
import { ErrorMessage } from '@/lib/error-handler';

export default function AddPatientButton() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  
  const { 
    mutate: addRelation, 
    isPending: isLoading, // Renamed from isPending for consistency with old 'loading' state
    error: hookError, 
    isError, 
    isSuccess
  } = useAddSpecialistPatientRelation();
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      // This case should ideally be handled by UI (e.g., button disabled if no user)
      console.error("User not authenticated");
      return;
    }
    
    addRelation({ patient_email: email }, {
      onSuccess: () => {
        // Success message will be shown via isSuccess and AlertMessage
        // The API route doesn't return the full user details, so no need to update local state with it.
        // Invalidation in the hook should handle refetching lists.
        setTimeout(() => {
          setShowModal(false);
          setEmail('');
          // Consider if window.location.reload() is truly necessary or if
          // React Query cache invalidation is sufficient to update relevant lists.
          // For now, keeping it as it might be there for a specific reason.
          window.location.reload(); 
        }, 2000);
      },
      // onError is handled by hookError and isError
    });
  };
  
  const typedHookError = hookError as ErrorMessage | null;

  return (
    <>
      <button
        onClick={() => {
          setShowModal(true);
          // Reset states when modal opens
          setEmail('');
        }}
        className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
      >
        Patiënt Toevoegen
      </button>
      
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Patiënt Toevoegen</h3>
              
              {isError && typedHookError && (
                <AlertMessage type="error" message={typedHookError.userMessage || 'Kon patiënt niet toevoegen.'} />
              )}
              {isSuccess && !isError && ( // Show success only if mutation succeeded without error
                <AlertMessage type="success" message="Patiënt succesvol toegevoegd! Pagina wordt vernieuwd." />
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    E-mailadres van patiënt
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                    disabled={isLoading}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Voer het e-mailadres in waarmee de patiënt is geregistreerd.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={isLoading}
                  >
                    Annuleren
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-md text-white font-medium ${
                      isLoading ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                    } transition-colors`}
                  >
                    {isLoading ? 'Bezig...' : 'Toevoegen'}
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
