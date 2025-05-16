'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AlertMessage } from '@/components/common/AlertMessage'; // Use named import
import { Task } from '@/types';
import { useUpsertTask } from '@/hooks/useMutations';
import { useTask } from '@/hooks/useSupabaseQuery';
import { useAuth } from '@/components/auth/AuthProvider';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorMessage } from '@/lib/error-handler';

interface TaskFormProps {
  taskId?: string;
  initialData?: Partial<Task>;
  isEditing?: boolean;
  initialType?: 'taak' | 'opdracht';
}

// Helper to convert Task fields to form-compatible strings
const taskToFormData = (task: Partial<Task> | null | undefined, defaultType: 'taak' | 'opdracht') => {
  return {
    type: task?.type || defaultType,
    titel: task?.titel || '',
    beschrijving: task?.beschrijving || '',
    duur: task?.duur?.toString() || '15', // Default to string '15'
    hartslag_doel: task?.hartslag_doel?.toString() || '', // Default to empty string
    herhaal_patroon: task?.herhaal_patroon || 'eenmalig',
    dagen_van_week: task?.dagen_van_week || [],
    metingen: task?.metingen || ['energie', 'pijn', 'vermoeidheid'],
    notities: task?.notities || '',
    labels: task?.labels || [],
  };
};

export default function TaskForm({ taskId, initialData, isEditing = false, initialType = 'taak' }: TaskFormProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Form field values, kept as strings for input compatibility where needed
  const [formState, setFormState] = useState(taskToFormData(initialData, initialType));

  // Fetch existing task data if editing and taskId is provided
  const { 
    data: fetchedTaskData, 
    isLoading: isLoadingTask, 
    error: fetchTaskError, // This will be ErrorMessage type
    isError: isFetchTaskError,
  } = useTask(taskId, { 
    enabled: !!taskId && isEditing && !initialData, // Only fetch if editing, taskId given, and no initialData prop
  });

  // Populate form with initialData prop or fetched data from useTask
  useEffect(() => {
    if (isEditing) {
      const dataToUse = initialData || fetchedTaskData;
      if (dataToUse) {
        setFormState(taskToFormData(dataToUse, initialType));
      }
    }
  }, [initialData, fetchedTaskData, isEditing, initialType]);

  // Mutation hook for upserting task
  const { mutate: upsertTask, isPending: isUpserting, error: upsertHookError, isError: isUpsertError } = useUpsertTask();

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
      console.error("User not authenticated. Cannot submit form.");
      // Optionally set a local error state to display in AlertMessage
      return;
    }

    const taskToSubmit: Partial<Task> = {
      ...formState,
      user_id: user.id,
      duur: formState.duur ? parseInt(formState.duur, 10) : undefined, // Use undefined
      hartslag_doel: formState.hartslag_doel ? parseInt(formState.hartslag_doel, 10) : undefined, // Use undefined
      // Ensure arrays are passed correctly
      dagen_van_week: formState.dagen_van_week || [],
      metingen: formState.metingen || [],
      labels: formState.labels || [],
    };

    if (isEditing && taskId) {
      taskToSubmit.id = taskId;
    } else {
      delete taskToSubmit.id; // Ensure no id is sent for new tasks
    }
    
    upsertTask(taskToSubmit, {
      onSuccess: (savedTask) => {
        console.log('Task saved:', savedTask);
        // TODO: Re-add planning logic if necessary, perhaps as a separate mutation or server-side effect
        router.push('/taken');
      },
      // onError is handled by upsertHookError and isUpsertError from the hook
    });
  };

  if (isLoadingTask) {
    return (
      <section id="task-form" className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Taak Laden...</h2>
        <SkeletonLoader type="form" count={5} />
      </section>
    );
  }

  // Error from fetching the task to edit
  const typedFetchTaskError = fetchTaskError as ErrorMessage | null;
  if (isFetchTaskError && typedFetchTaskError) {
     return (
      <section id="task-form" className="bg-white rounded-lg shadow-md p-6">
        <AlertMessage type="error" title="Fout bij laden" message={typedFetchTaskError.userMessage || "Kon taakdetails niet laden."} />
      </section>
     );
  }
  
  // Error from submitting the form
  const typedUpsertError = upsertHookError as ErrorMessage | null;

  return (
    <section id="task-form" className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">
        {isEditing ? 'Bewerk' : 'Nieuwe'} {formState.type === 'opdracht' ? 'Opdracht' : 'Taak'}
      </h2>

      {isUpsertError && typedUpsertError && (
        <AlertMessage type="error" message={typedUpsertError.userMessage || 'Opslaan van taak mislukt'} />
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-2">Type</label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setFormState(prev => ({ ...prev, type: 'taak' }))}
              className={`px-4 py-2 rounded-md transition ${
                formState.type === 'taak'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Taak
            </button>
            <button
              type="button"
              onClick={() => setFormState(prev => ({ ...prev, type: 'opdracht' }))}
              className={`px-4 py-2 rounded-md transition ${
                formState.type === 'opdracht'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Opdracht
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="titel" className="block text-gray-700 font-medium mb-2">Titel</label>
          <input
            id="titel" name="titel" type="text" value={formState.titel}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="beschrijving" className="block text-gray-700 font-medium mb-2">Beschrijving / Instructies</label>
          <textarea
            id="beschrijving" name="beschrijving" value={formState.beschrijving}
            onChange={handleChange} rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          ></textarea>
        </div>

        <div className="mb-4">
          <label htmlFor="duur" className="block text-gray-700 font-medium mb-2">Duur (minuten)</label>
          <input
            id="duur" name="duur" type="number" min="1" max="480" value={formState.duur}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {formState.type === 'opdracht' && (
          <div className="mb-4">
            <label htmlFor="hartslag_doel" className="block text-gray-700 font-medium mb-2">Hartslag Doel (BPM)</label>
            <input
              id="hartslag_doel" name="hartslag_doel" type="number" min="40" max="200" value={formState.hartslag_doel}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="herhaal_patroon" className="block text-gray-700 font-medium mb-2">Herhaalpatroon</label>
          <select
            id="herhaal_patroon" name="herhaal_patroon" value={formState.herhaal_patroon}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="eenmalig">Eenmalig</option>
            <option value="dagelijks">Dagelijks</option>
            <option value="wekelijks">Wekelijks</option>
            <option value="maandelijks">Maandelijks</option>
            <option value="aangepast">Aangepast</option>
          </select>
        </div>

        {formState.herhaal_patroon === 'wekelijks' && (
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Dagen van de week</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: '0', label: 'Zo' }, { key: '1', label: 'Ma' }, { key: '2', label: 'Di' },
                { key: '3', label: 'Wo' }, { key: '4', label: 'Do' }, { key: '5', label: 'Vr' },
                { key: '6', label: 'Za' }
              ].map(day => (
                <button
                  key={day.key} type="button" onClick={() => handleDayToggle(day.key)}
                  className={`px-3 py-1 rounded-md ${
                    (formState.dagen_van_week || []).includes(day.key)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Te registreren metingen</label>
          <div className="space-y-2">
            {[
              { key: 'energie', label: 'Energie' }, { key: 'pijn', label: 'Pijn' },
              { key: 'vermoeidheid', label: 'Vermoeidheid' }, { key: 'stemming', label: 'Stemming' },
              { key: 'hartslag', label: 'Hartslag' }
            ].map(measurement => (
              <div key={measurement.key} className="flex items-center">
                <input
                  id={`meting-${measurement.key}`} type="checkbox"
                  checked={(formState.metingen || []).includes(measurement.key)}
                  onChange={() => handleMeasurementToggle(measurement.key)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor={`meting-${measurement.key}`} className="ml-2 block text-sm text-gray-700">
                  {measurement.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="labels" className="block text-gray-700 font-medium mb-2">Labels (komma-gescheiden)</label>
          <input
            id="labels" name="labels" type="text" value={(formState.labels || []).join(', ')}
            onChange={handleLabelChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Bijv. belangrijk, werk, thuis"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="notities" className="block text-gray-700 font-medium mb-2">Notities</label>
          <textarea
            id="notities" name="notities" value={formState.notities || ''}
            onChange={handleChange} rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          ></textarea>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button" onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isUpserting}
          >
            Annuleren
          </button>
          
          <button
            type="submit"
            disabled={isUpserting}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              isUpserting ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
            } transition-colors`}
          >
            {isUpserting ? 'Bezig met opslaan...' : 'Opslaan'}
          </button>
        </div>
      </form>
    </section>
  );
}
