
// Fix voor ontbrekende property 'addNotification' op Element type
declare module "react" {
  interface Element {
    addNotification?: unknown;
  }
}
'use client';
import React, { useState, FormEvent } from 'react';
import { _useAuth as useAuth } from '@/components/auth/AuthProvider'; 
import { useAddSpecialistPatientRelation } from '@/hooks/useMutations';
import { ErrorMessage } from '@/lib/error-handler';
import AddPatientButtonPresentational from '@/components/specialisten/AddPatientButtonPresentational';
import { useNotification } from '@/context/NotificationContext'; // Import useNotification
import { useQueryClient } from '@tanstack/react-query'; // To invalidate queries
import { useRouter } from 'next/navigation'; // Import useRouter

export default function AddPatientButtonContainer(): JSX.Element {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient(); // Get query client instance
  const router = useRouter(); // Get router instance

  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  
  const { 
    mutate: addRelation, 
    isPending: isLoading, 
    error: hookError, 
    isError, 
    isSuccess,
    reset, // Function to reset mutation state
  } = useAddSpecialistPatientRelation();
  
  const handleOpenModal = () => {
    setEmail(''); // Reset email
    reset(); // Reset mutation state (error: unknown, success flags)
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    // Email and mutation state are reset when modal opens or on successful submission
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      addNotification({ type: 'error', message: 'U moet ingelogd zijn om een patiënt toe te voegen.' });
      return;
    }
    
    addRelation({ patient_email: email }, {
      onSuccess: () => {
        addNotification({ type: 'success', message: 'Patiënt succesvol toegevoegd!' });
        
        // Invalidate client-side React Query cache if used elsewhere for this data
        queryClient.invalidateQueries({ queryKey: ['specialistPatients', user?.id] }); 
        // queryClient.invalidateQueries({ queryKey: ['profiles'] }); // Might be too broad

        // Refresh Server Component data
        router.refresh();

        setTimeout(() => {
          handleCloseModal(); 
        }, 1500); // Keep modal open for a bit to show success message
      },
      onError: (error: unknown) => {
        // Notification is handled by the hook via NotificationContext if configured
        // Or, can add specific notification here too
        addNotification({ type: 'error', message: (error as ErrorMessage).userMessage || 'Kon patiënt niet toevoegen.' });
      }
    });
  };
  
  // If user is not a specialist, this button might not be rendered at all by parent.
  // Or add a check here:
  // const { data: profile } = useProfile(user?.id);
  // if (profile?.type !== 'specialist') return <></>; // Empty fragment instead of null


  return (
    <AddPatientButtonPresentational
      showModal={showModal}
      email={email}
      isLoading={isLoading}
      error={hookError as ErrorMessage | null}
      isSuccess={isSuccess && !isError} // Ensure success is true only if no error
      onOpenModal={handleOpenModal}
      onCloseModal={handleCloseModal}
      onEmailChange={handleEmailChange}
      onSubmit={handleSubmit}
    />
  );
}
