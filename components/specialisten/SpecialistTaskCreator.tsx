
// Fix voor ontbrekende property 'addNotification' op Element type
declare module "react" {
  interface Element {
    addNotification?: unknown;
  }
}
import React from 'react';

'use client';

import { useState, useEffect } from 'react'; // useEffect terug toegevoegd
import { Profile, Task } from '@/types';
import Link from 'next/link';
import CreateTaskAssignmentForm from './CreateTaskAssignmentForm';
import { useTasksForUserBySpecialist } from '@/hooks/useSupabaseQuery'; // Gebruik de nieuwe hook
import { useDeleteTask } from '@/hooks/useMutations'; // Importeer delete hook
import { useNotification } from '@/context/NotificationContext'; // Voor notificaties
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'; // Voor laadstatus

interface SpecialistTaskCreatorProps {
  patients: Profile[];
  specialistId: string;
}

export default function SpecialistTaskCreator({ patients, specialistId }: SpecialistTaskCreatorProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null); // State voor de taak die bewerkt wordt

  const { 
    data: assignedTasks, 
    isLoading: isLoadingTasks, 
    error: tasksError,
    refetch: refetchTasks // Functie om taken opnieuw op te halen
  } = useTasksForUserBySpecialist(selectedPatientId, specialistId, { 
    enabled: !!selectedPatientId,
      queryKey: ["profile", userId], // Alleen fetchen als een patiënt is geselecteerd
  });

  const { addNotification } = useNotification();
  const { mutate: deleteTask, isPending: isDeletingTask } = useDeleteTask();

  const handlePatientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPatientId(e.target.value || null);
  };
  
  // Callback voor na het aanmaken of bijwerken van een taak
  const handleTaskUpserted = () => {
    if (selectedPatientId) {
      refetchTasks(); // Haal de takenlijst opnieuw op
    }
    setEditingTask(null); // Verlaat edit mode
  };

  const handleEditTask = (task: Task) => {
    // Zorg ervoor dat de geselecteerde patiënt overeenkomt met de user_id van de taak
    if (task.user_id === selectedPatientId) {
      setEditingTask(task);
      // Scroll naar het formulier (optioneel)
      // document.getElementById('task-assignment-form')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      addNotification({ type: 'warning', message: 'Kan taak niet bewerken, selecteer eerst de juiste patiënt.'});
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (!selectedPatientId) return; 

    if (!window.confirm(`Weet u zeker dat u deze taak wilt verwijderen?`)) { // Duidelijkere bevestigingstekst
      return;
    }

    deleteTask(taskId, {
      onSuccess: () => {
        addNotification({ type: 'success', message: 'Taak succesvol verwijderd.' });
        refetchTasks(); 
        if (editingTask?.id === taskId) { // Als de bewerkte taak is verwijderd
          setEditingTask(null);
        }
      },
      onError: (error: unknown) => {
        addNotification({ type: 'error', message: error.userMessage || 'Fout bij verwijderen taak.' });
      }
    });
  };

  // Wanneer de geselecteerde patiënt verandert, reset de editingTask state
  useEffect(() => {
    setEditingTask(null);
  return undefined; // Add default return
  }, [selectedPatientId]);

  // Verwijder het gedupliceerde blok hieronder
  // if (patients.length === 0) {
  //   if (!window.confirm(`Weet u zeker dat u taak ${taskId} wilt verwijderen?`)) {
  //     return;
  //   }

  //   deleteTask(taskId, {
  //     onSuccess: () => {
  //       addNotification({ type: 'success', message: 'Taak succesvol verwijderd.' });
  //       refetchTasks(); // Ververs de lijst
  //     },
  //     onError: (error: unknown) => {
  //       addNotification({ type: 'error', message: error.userMessage || 'Fout bij verwijderen taak.' });
  //     }
  //   });
  // };

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
          value={selectedPatientId || ''}
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
          initialData={editingTask} // Geef de te bewerken taak mee
        />
      </div>
      
      {selectedPatientId && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-3">
            Toegewezen Taken aan Geselecteerde Patiënt
          </h3>
          {isLoadingTasks && <SkeletonLoader type="list" count={3} />}
          {tasksError && <p className="text-red-500">Fout bij het laden van taken: {tasksError.userMessage}</p>}
          {!isLoadingTasks && !tasksError && (!assignedTasks || assignedTasks.length === 0) && (
            <p className="text-gray-500">Nog geen taken toegewezen aan deze patiënt door u.</p>
          )}
          {!isLoadingTasks && !tasksError && assignedTasks && assignedTasks.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titel</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Herhaling</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aangemaakt op</th>
                    {/* <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patiënt</th> */}
                    <th scope="col" className="relative px-4 py-3">
                      <span className="sr-only">Acties</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignedTasks.map((task: Task) => {
                    // const patient = patients.find(p => p.id === task.user_id); // Niet nodig, lijst is al per patiënt
                    return (
                      <tr key={task.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{task.titel}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{task.type}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{task.herhaal_patroon}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(task.created_at).toLocaleString('nl-BE', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        {/* <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{patient ? `${patient.voornaam} ${patient.achternaam}` : 'N/B'}</td> */}
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEditTask(task)}
                            className="text-indigo-600 hover:text-indigo-800 disabled:text-gray-400"
                            disabled={isDeletingTask} // Kan ook een aparte isEditingFormLoading state gebruiken
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
      {/* Debug log - kan verwijderd worden */}
      {/* {selectedPatientId && <p className="mt-2 text-xs text-gray-500">Debug: Geselecteerde Patiënt ID: {selectedPatientId} | Specialist ID: {specialistId}</p>} */}
    </>
  );
}
