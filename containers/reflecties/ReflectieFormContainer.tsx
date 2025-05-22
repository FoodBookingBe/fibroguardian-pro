
// Fix voor ontbrekende property 'addNotification' op Element type
declare module "react" {
  interface Element {
    addNotification?: unknown;
  }
}
'use client';
import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { _useAuth as useAuth } from '@/components/auth/AuthProvider';
import { useUpsertReflectie } from '@/hooks/useMutations';
import { ReflectieFormData as ReflectieUpsertData } from '@/types'; // Renaming for clarity if ReflectieFormData is also used for form state
import { ErrorMessage } from '@/lib/error-handler';
import { useFocusManagement } from '@/utils/accessibility';
import ReflectieFormPresentational, { ReflectieFormState, StemmingP } from '@/components/reflecties/ReflectieFormPresentational';
import { useNotification } from '@/context/NotificationContext';

interface ReflectieFormContainerProps {
  initialDatum?: string; // YYYY-MM-DD
  // If editing a specific existing reflection, an ID or full initialData could be passed
  // For now, this container handles upsert based on date for the logged-in user
}

export default function ReflectieFormContainer({ initialDatum }: ReflectieFormContainerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  
  const vandaag = new Date().toISOString().split('T')[0];
  
  const [formState, setFormState] = useState<ReflectieFormState>({
    datum: initialDatum || vandaag,
    stemming: 'neutraal' as StemmingP,
    notitie: '',
  });

  const { 
    mutate: upsertReflectie, 
    isPending: isUpserting, 
    error: upsertHookError,
    isError: isUpsertError,
    isSuccess: isUpsertSuccess
  } = useUpsertReflectie();
  
  const stemmingOpties: StemmingP[] = [
    'zeer goed', 'goed', 'neutraal', 'matig', 'slecht', 'zeer slecht'
  ];

  const stemmingKleur = (stemming: StemmingP) => {
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
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleStemmingSelect = (stemming: StemmingP) => {
    setFormState(prev => ({ ...prev, stemming }));
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      addNotification({ type: 'error', message: 'U moet ingelogd zijn om een reflectie op te slaan.' });
      return;
    }

    if (!formState.datum) {
      addNotification({ type: 'error', message: 'Datum is verplicht voor de reflectie.' });
      return;
    }

    const dataToUpsert: ReflectieUpsertData = {
        datum: formState.datum, 
        stemming: formState.stemming,
        notitie: formState.notitie,
        // user_id will be added by the hook or API based on the authenticated user
    };
    
    upsertReflectie(dataToUpsert, {
      onSuccess: () => {
        addNotification({ type: 'success', message: 'Reflectie succesvol opgeslagen!' });
        // Delay redirect slightly to allow user to see success message if not using global notifications that persist
        setTimeout(() => router.push('/reflecties'), 500); 
        router.refresh(); // Ensure server components on the target page are updated
      },
      onError: (error: unknown) => {
        // Notification is handled by the hook's global error handling via NotificationContext
        // but if specific local display is needed, it can be done here too.
        // addNotification({ type: 'error', message: (error as ErrorMessage).userMessage || 'Opslaan van reflectie mislukt.' });
      }
    });
  };

  const handleCancel = () => {
    router.back();
  };
  
  const submitButtonRef = useFocusManagement<HTMLButtonElement>(isUpsertError);

  return (
    <ReflectieFormPresentational
      formState={formState}
      isUpserting={isUpserting}
      upsertError={upsertHookError as ErrorMessage | null}
      isUpsertSuccess={isUpsertSuccess}
      vandaag={vandaag}
      stemmingOpties={stemmingOpties}
      stemmingKleur={stemmingKleur}
      onFormChange={handleChange}
      onStemmingSelect={handleStemmingSelect}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitButtonRef={submitButtonRef}
    />
  );
}