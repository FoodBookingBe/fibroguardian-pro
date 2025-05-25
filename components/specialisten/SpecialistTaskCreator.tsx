'use client';

// Fix voor ontbrekende property 'addNotification' op Element type
declare module "react" {
  interface Element {
    addNotification?: unknown;
  }
}
import React from 'react';

import { SkeletonLoader } from '@/components/ui/SkeletonLoader'; // Voor laadstatus
import { useNotification } from '@/context/NotificationContext'; // Voor notificaties
import { useDeleteTask } from '@/hooks/useMutations'; // Importeer delete hook
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { Profile, Task } from '@/types';
import Link from 'next/link';
import { useEffect, useState } from 'react'; // useEffect terug toegevoegd
import CreateTaskAssignmentForm from './CreateTaskAssignmentForm';

interface SpecialistTaskCreatorProps {
  patients: Profile[];
  specialistId: string;
}

export default function SpecialistTaskCreator({ patients, specialistId }: SpecialistTaskCreatorProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addNotification } = useNotification();

  // Fetch tasks when patient is selected
  useEffect(() => {
    const fetchTasks = async () => {
      if (!selectedPatientId) {
        setTasks([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', selectedPatientId)
          .eq('specialist_id', specialistId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTasks(data || []);
      } catch (err: unknown) {
        setError((err as any).message || 'Fout bij ophalen taken');
        console.error('Error fetching tasks:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [selectedPatientId, specialistId]);

  const handlePatientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPatientId(e.target.value);
  };

  const handleTaskUpserted = () => {
    // Refresh tasks after create/update
    if (selectedPatientId) {
      const event = new Event('tasks-updated');
      window.dispatchEvent(event);
    }
  };

  const { mutate: deleteTask, isPending: isDeletingTask } = useDeleteTask();

  const handleEditTask = (task: Task) => {
    // Handle edit task - could open a modal or navigate to edit page
    console.log('Edit task:', task);
    // You could emit an event or call a callback prop here
  };

  const handleDeleteTask = (taskId: string) => {
    if (!window.confirm('Weet u zeker dat u deze taak wilt verwijderen?')) {
      return;
    }

    deleteTask(taskId, {
      onSuccess: () => {
        addNotification({ type: 'success', message: 'Taak succesvol verwijderd.' });
        // Refresh tasks
        setTasks(prev => prev.filter(task => task.id !== taskId));
      },
      onError: (error: any) => {
        addNotification({ type: 'error', message: error?.userMessage || 'Fout bij verwijderen taak.' });
      }
    });
  };

  if (patients.length === 0) {
    return (
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-center">
        <p className="text-yellow-700">
          U heeft nog geen patiënten gekoppeld. Voeg eerst patiënten toe via{" "}
          <Link href="/specialisten/patienten" className="font-medium underline hover:text-yellow-800">
            Mijn Patiënten
          </Link>.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-4">
        <label htmlFor="patient-select" className="block text-sm font-medium text-gray-700 mb-1">
          Selecteer Patiënt:
        </label>
        <select
          id="patient-select"
          name="patient-select"
          value={selectedPatientId}
          onChange={handlePatientSelect}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
        >
          <option value="">-- Kies een patiënt --</option>
          {patients.map(p => (
            <option key={p.id} value={p.id}>
              {p.voornaam} {p.achternaam} ({p.email})
            </option>
          ))}
        </select>
      </div>

      <div id="task-assignment-form"> {/* ID voor scroll target */}
        <CreateTaskAssignmentForm
          selectedPatientId={selectedPatientId}
          specialistId={specialistId}
          onTaskUpserted={handleTaskUpserted}
        />
      </div>

      {selectedPatientId && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-3">
            Toegewezen Taken aan Geselecteerde Patiënt
          </h3>
          {isLoading && <SkeletonLoader type="list" count={3} />}
          {error && <p className="text-red-500">Fout bij het laden van taken: {error}</p>}
          {!isLoading && !error && (!tasks || tasks.length === 0) && (
            <p className="text-gray-500">Nog geen taken toegewezen aan deze patiënt door u.</p>
          )}
          {!isLoading && !error && tasks && tasks.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titel</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Herhaling</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aangemaakt op</th>
                    <th scope="col" className="relative px-4 py-3">
                      <span className="sr-only">Acties</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks.map((task: Task) => {
                    return (
                      <tr key={task.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{task.titel}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{task.type}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{task.herhaal_patroon}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(task.created_at).toLocaleString('nl-BE', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEditTask(task)}
                            className="text-indigo-600 hover:text-indigo-800 disabled:text-gray-400"
                            disabled={isDeletingTask}
                          >
                            Bewerk
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-600 hover:text-red-800 disabled:text-gray-400"
                            disabled={isDeletingTask}
                          >
                            {isDeletingTask ? 'Bezig...' : 'Verwijder'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
