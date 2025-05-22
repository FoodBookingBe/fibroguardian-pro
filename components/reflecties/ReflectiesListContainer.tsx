import React from 'react';

'use client';

import { useReflecties } from '@/hooks/useSupabaseQuery';
import { useDeleteReflectie } from '@/hooks/useMutations';
import { ConditionalRender } from '@/components/ui/ConditionalRender';
import ReflectiesList from './ReflectiesList'; // Assuming ReflectiesList is in the same directory
import { ErrorMessage } from '@/lib/error-handler';
import Link from 'next/link'; // For the empty state button

// Define an EmptyState component or use inline JSX for emptyFallback
const EmptyReflectiesState = () => (
  <div className="bg-white rounded-lg shadow-md p-8 text-center">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
    <h2 className="text-xl font-semibold text-gray-700 mb-2">Geen reflecties gevonden</h2>
    <p className="text-gray-500 mb-6">Deel uw dagelijkse ervaringen en houd bij hoe u zich voelt.</p>
    <Link 
      href="/reflecties/nieuw" 
      className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors inline-flex items-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      Eerste Reflectie Toevoegen
    </Link>
  </div>
);

export function ReflectiesListContainer({ userId }: { userId: string }) {
  const { 
    data: reflecties, 
    isLoading, 
    error, // This will be ErrorMessage type
    isError, // Boolean flag from React Query
    // refetch // Can be used for pull-to-refresh or manual refresh
  } = useReflecties(userId); // Default limit is 10
  
  const { 
    mutate: deleteReflectie, 
    isPending: isDeleting, 
    // error: deleteError, // Error for delete can be handled via onSuccess/onError or a separate state
    // isError: isDeleteError
  } = useDeleteReflectie();

  const handleDelete = (reflectieId: string) => {
    deleteReflectie({ id: reflectieId, userId: userId }, {
      onSuccess: () => {
        // Notification can be handled globally or by parent component
        // Query invalidation is handled within the useDeleteReflectie hook
        console.log(`Reflectie ${reflectieId} verwijderd.`);
      },
      onError: (err: ErrorMessage) => {
        console.error(`Fout bij verwijderen reflectie ${reflectieId}:`, err.userMessage);
        // Show error notification
      }
    });
  };
  
  return (
    <ConditionalRender
      isLoading={isLoading}
      isError={isError}
      error={error} // Pass the error object from useReflecties
      data={reflecties}
      skeletonType="reflecties" // This type needs to be defined in SkeletonLoader
      emptyFallback={<EmptyReflectiesState />}
    >
      {(data: unknown) => (
        <ReflectiesList 
          reflecties={data} 
          onDelete={handleDelete} 
          isDeletingId={isDeleting ? 'pending' : null} // Pass a generic deleting indicator or specific ID if hook provides it
        />
      )}
    </ConditionalRender>
  );
}
