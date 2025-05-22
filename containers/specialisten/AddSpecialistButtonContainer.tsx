
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
import AddSpecialistButtonPresentational from '@/components/specialisten/AddSpecialistButtonPresentational';
import { useNotification } from '@/context/NotificationContext';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { useQueryClient } from '@tanstack/react-query';

export default function AddSpecialistButtonContainer(): JSX.Element {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  
  const { 
    mutate: addRelation, 
    isPending: isAddingRelation,
    // Error from mutation hook will be handled by global notification via onError in addRelation call
  } = useAddSpecialistPatientRelation();
  
  const handleOpenModal = () => {
    setEmail('');
    setFormError(null);
    // Reset mutation state if useAddSpecialistPatientRelation hook provides a reset function
    // For now, errors/success are handled by notifications and local formError.
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (formError) setFormError(null); // Clear form error when user types
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!user) {
      setFormError("U moet ingelogd zijn om een specialist toe te voegen.");
      addNotification({ type: 'error', message: "U moet ingelogd zijn." });
      return;
    }
    if (!email.trim()) {
      setFormError("E-mailadres van specialist is verplicht.");
      return;
    }

    const supabaseClient = getSupabaseBrowserClient();
    try {
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

      const { data: specialistData, error: specialistLookupError } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('email', email)
        .eq('type', 'specialist')
        .single();

      if (specialistLookupError || !specialistData) {
        setFormError('Geen specialist gevonden met dit e-mailadres, of de gebruiker is geen specialist.');
        return;
      }
      const specialistIdToAdd = specialistData.id;

      addRelation({ specialist_id_to_add: specialistIdToAdd }, {
        onSuccess: () => {
          addNotification({ type: 'success', message: 'Specialist succesvol toegevoegd!' });
          queryClient.invalidateQueries({ queryKey: ['mySpecialists', user.id] }); 
          // Potentially invalidate other related queries if necessary
          // queryClient.invalidateQueries({ queryKey: ['profiles'] });
          setTimeout(() => {
            handleCloseModal();
          }, 1500);
        },
        onError: (error: ErrorMessage) => {
          addNotification({ type: 'error', message: error.userMessage || 'Fout bij toevoegen specialist.' });
          // Optionally setFormError(error.userMessage) if you want to display it in the modal too
        }
      });

    } catch (err: unknown) {
      console.error('Error in AddSpecialistButton handleSubmit:', err);
      const userMessage = (err as any).message || 'Er is een onverwachte fout opgetreden.';
      setFormError(userMessage);
      addNotification({ type: 'error', message: userMessage });
    }
  };
  
  // This button might be conditionally rendered by its parent if only patients can see it.
  // If not, add a check here based on user's profile type.
  // const { data: profile } = useProfile(user?.id);
  // if (profile?.type !== 'patient') return <></>; // Empty fragment instead of null


  return (
    <AddSpecialistButtonPresentational
      showModal={showModal}
      email={email}
      isLoading={isAddingRelation}
      formError={formError}
      onOpenModal={handleOpenModal}
      onCloseModal={handleCloseModal}
      onEmailChange={handleEmailChange}
      onSubmit={handleSubmit}
    />
  );
}
