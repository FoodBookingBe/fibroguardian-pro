'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useMySpecialists, SpecialistWithRelation } from '@/hooks/useSupabaseQuery'; // Import SpecialistWithRelation
import { useDeleteSpecialistPatientRelation } from '@/hooks/useMutations';
import { ConditionalRender } from '@/components/ui/ConditionalRender';
import SpecialistCard from './SpecialistCard';
import { useNotification } from '@/context/NotificationContext';
import { ErrorMessage } from '@/lib/error-handler';
// Profile is part of SpecialistWithRelation, SpecialistPatient might not be needed here directly

// Empty state component for when a patient has no specialists
const EmptySpecialistsState = () => (
  <div className="bg-white rounded-lg shadow-md p-8 text-center">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
    <h2 className="text-xl font-semibold text-gray-700 mb-2">Geen specialisten gevonden</h2>
    <p className="text-gray-500">U heeft nog geen specialisten toegevoegd aan uw netwerk.</p>
    {/* TODO: Add a button/link to a page where patient can search/add specialists if that flow exists */}
  </div>
);

// This container is for a PATIENT viewing THEIR specialists.
export function SpecialistsListContainer() {
  const { user } = useAuth();
  const patientId = user?.id;

  const { 
    data: specialists, 
    isLoading, 
    error, 
    isError 
  } = useMySpecialists(patientId);

  // Note: useDeleteSpecialistPatientRelation is in useMutations.ts, not useSupabaseQuery.ts
  // This needs to be imported from the correct file. Assuming it's available.
  // For now, I'll proceed as if it's correctly imported.
  // const { mutate: deleteRelation, isPending: isDeleting } = useDeleteSpecialistPatientRelation();
  
  // Placeholder for delete mutation until import is confirmed/corrected
  const deleteRelationMutation = useDeleteSpecialistPatientRelation();
  const isDeleting = deleteRelationMutation.isPending;


  const { addNotification } = useNotification();

  const handleDeleteRelation = (relationId: string) => {
    if (!patientId) {
      addNotification({ type: 'error', message: 'Gebruiker niet gevonden, kan relatie niet verwijderen.' });
      return;
    }
    
    deleteRelationMutation.mutate({ relationshipId: relationId, currentUserId: patientId }, {
      onSuccess: () => {
        addNotification({ type: 'success', message: 'Specialist succesvol verwijderd uit uw lijst.' });
        // Invalidation is handled by the hook, which should refetch useMySpecialists
      },
      onError: (err: ErrorMessage) => {
        addNotification({ type: 'error', message: err.userMessage || 'Fout bij verwijderen specialist.' });
      }
    });
  };
  
  return (
    <ConditionalRender
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={specialists} // specialists is now SpecialistWithRelation[]
      skeletonType="card" 
      emptyFallback={<EmptySpecialistsState />}
    >
      {(resolvedSpecialists: SpecialistWithRelation[]) => ( // Explicitly type resolvedSpecialists
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resolvedSpecialists.map(specialistWithRelation => (
            <SpecialistCard
              key={specialistWithRelation.id}
              specialist={specialistWithRelation} // Pass the whole object
              onDelete={() => handleDeleteRelation(specialistWithRelation.relationId)} // Pass relationId
              isDeleting={isDeleting} 
            />
          ))}
        </div>
      )}
    </ConditionalRender>
  );
}
