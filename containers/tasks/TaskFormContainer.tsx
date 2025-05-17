'use client';
import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/types';
import { useUpsertTask } from '@/hooks/useMutations';
import { useTask } from '@/hooks/useSupabaseQuery';
import { useAuth } from '@/components/auth/AuthProvider';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorMessage } from '@/lib/error-handler';
import TaskFormPresentational, { TaskFormData } from '@/components/tasks/TaskFormPresentational';
import { AlertMessage } from '@/components/common/AlertMessage';
import { useNotification } from '@/context/NotificationContext'; // Import useNotification

interface TaskFormContainerProps {
  taskId?: string;
  initialData?: Partial<Task>; // For passing data directly, e.g. from a modal prefill
  isEditing?: boolean;
  initialType?: 'taak' | 'opdracht';
}

// Helper to convert Task fields to form-compatible strings and structure
const taskToFormData = (task: Partial<Task> | null | undefined, defaultType: 'taak' | 'opdracht'): TaskFormData => {
  return {
    type: task?.type || defaultType,
    titel: task?.titel || '',
    beschrijving: task?.beschrijving || '',
    duur: task?.duur?.toString() || '15',
    hartslag_doel: task?.hartslag_doel?.toString() || '',
    herhaal_patroon: task?.herhaal_patroon || 'eenmalig',
    dagen_van_week: task?.dagen_van_week || [],
    metingen: task?.metingen || ['energie', 'pijn', 'vermoeidheid'],
    notities: task?.notities || '',
    labels: task?.labels || [],
  };
};

export default function TaskFormContainer({ 
  taskId, 
  initialData: initialDataProp, // Renamed to avoid conflict with fetchedTaskData
  isEditing = !!taskId, // Infer isEditing if taskId is present
  initialType = 'taak' 
}: TaskFormContainerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const [formState, setFormState] = useState<TaskFormData>(taskToFormData(initialDataProp, initialType));

  const { 
    data: fetchedTaskData, 
    isLoading: isLoadingTask, 
    error: fetchTaskError,
    isError: isFetchTaskError,
  } = useTask(taskId, { 
    enabled: isEditing && !!taskId && !initialDataProp, 
  });

  useEffect(() => {
    if (isEditing) {
      const dataToUse = initialDataProp || fetchedTaskData;
      if (dataToUse) {
        setFormState(taskToFormData(dataToUse, initialType));
      }
    } else if (initialDataProp) { // For new tasks with prefilled data
        setFormState(taskToFormData(initialDataProp, initialType));
    }
  }, [initialDataProp, fetchedTaskData, isEditing, initialType]);

  const { 
    mutate: upsertTask, 
    isPending: isUpserting, 
    error: upsertHookError, 
    isError: isUpsertError 
  } = useUpsertTask();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleDayToggle = (day: string) => {
    const currentDays = formState.dagen_van_week || [];
    const days = [...currentDays];
    const index = days.indexOf(day);
    if (index > -1) {
      days.splice(index, 1);
    } else {
      days.push(day);
    }
    setFormState(prev => ({ ...prev, dagen_van_week: days }));
  };

  const handleMeasurementToggle = (measurement: string) => {
    const currentMetingen = formState.metingen || [];
    const measurements = [...currentMetingen];
    const index = measurements.indexOf(measurement);
    if (index > -1) {
      measurements.splice(index, 1);
    } else {
      measurements.push(measurement);
    }
    setFormState(prev => ({ ...prev, metingen: measurements }));
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const labels = e.target.value.split(',').map(label => label.trim()).filter(label => label !== '');
    setFormState(prev => ({ ...prev, labels }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      addNotification({ type: 'error', message: 'U moet ingelogd zijn om een taak op te slaan.' });
      return;
    }

    const taskToSubmit: Partial<Task> = {
      ...formState,
      user_id: user.id,
      duur: formState.duur ? parseInt(formState.duur, 10) : undefined,
      hartslag_doel: formState.hartslag_doel ? parseInt(formState.hartslag_doel, 10) : undefined,
      dagen_van_week: formState.dagen_van_week || [],
      metingen: formState.metingen || [],
      labels: formState.labels || [],
    };

    if (isEditing && taskId) {
      taskToSubmit.id = taskId;
    } else {
      delete taskToSubmit.id; 
    }
    
    upsertTask(taskToSubmit, {
      onSuccess: (savedTask) => {
        addNotification({ type: 'success', message: `Taak '${savedTask.titel}' succesvol ${isEditing ? 'bijgewerkt' : 'aangemaakt'}!` });
        router.push('/taken'); 
        router.refresh(); // To ensure server components using this data are updated
      },
      onError: (error) => {
        addNotification({ type: 'error', message: (error as ErrorMessage).userMessage || 'Opslaan van taak mislukt.' });
      }
    });
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoadingTask) {
    return (
      <section id="task-form" className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Taak Laden...</h2>
        <SkeletonLoader type="form" count={5} />
      </section>
    );
  }

  const typedFetchTaskError = fetchTaskError as ErrorMessage | null;
  if (isFetchTaskError && typedFetchTaskError) {
     return (
      <section id="task-form" className="bg-white rounded-lg shadow-md p-6">
        <AlertMessage type="error" title="Fout bij laden" message={typedFetchTaskError.userMessage || "Kon taakdetails niet laden."} />
      </section>
     );
  }
  
  return (
    <TaskFormPresentational
      formState={formState}
      isEditing={isEditing}
      isUpserting={isUpserting}
      upsertError={upsertHookError as ErrorMessage | null}
      onFormChange={handleChange}
      onDayToggle={handleDayToggle}
      onMeasurementToggle={handleMeasurementToggle}
      onLabelChange={handleLabelChange}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}