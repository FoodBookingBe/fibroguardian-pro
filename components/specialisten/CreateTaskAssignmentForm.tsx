'use client';

// Fix voor ontbrekende property 'addNotification' op Element type
declare module "react" {
  interface Element {
    addNotification?: unknown;
  }
}
import React from 'react';

import { useNotification } from '@/context/NotificationContext';
import { useUpsertTask } from '@/hooks/useMutations';
import { Task } from '@/types';
import { useEffect, useState } from 'react'; // useEffect toegevoegd

interface CreateTaskAssignmentFormProps {
  selectedPatientId: string | null; // ID van de patiënt voor wie de taak is
  specialistId: string; // ID van de ingelogde specialist
  onTaskUpserted?: () => void; // Callback na aanmaken/bijwerken
  initialData?: Task | null; // Voor het bewerken van een bestaande taak
}

// Velden die in het formulier bewerkt kunnen worden
type TaskFormData = Omit<Task, 'id' | 'user_id' | 'specialist_id' | 'created_at' | 'updated_at'>;

const defaultFormData: Partial<TaskFormData> = {
  titel: '',
  beschrijving: '',
  type: 'taak',
  herhaal_patroon: 'eenmalig',
  duur: 30,
  hartslag_doel: undefined,
  notities: '',
  labels: [],
};

export default function CreateTaskAssignmentForm({
  selectedPatientId,
  specialistId,
  onTaskUpserted,
  initialData
}: CreateTaskAssignmentFormProps) {
  const [formData, setFormData] = useState<Partial<TaskFormData>>(defaultFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  // Het gedupliceerde blok hieronder is verwijderd
  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});

  const { addNotification } = useNotification();
  const { mutate: upsertTask, isPending: isLoading } = useUpsertTask();

  useEffect(() => {
    if (initialData && selectedPatientId === initialData.user_id) { // Zorg dat de geselecteerde patiënt overeenkomt
      // Filter alleen de velden die in TaskFormData zitten
      const { id, user_id, specialist_id: initialSpecialistId, created_at, updated_at, ...editableData } = initialData;
      setFormData(editableData);
      setIsEditing(true);
      setCurrentTaskId(id);
    } else {
      // Reset naar create mode als de patiënt niet overeenkomt
      setFormData({
        titel: '',
        beschrijving: '',
        type: 'taak',
        duur: 30,
        herhaal_patroon: 'eenmalig',
        dagen_van_week: [],
        metingen: [],
        notities: '',
        labels: [],
        hartslag_doel: undefined,
      });
      setIsEditing(false);
      setCurrentTaskId(null);
    }
    return undefined; // Add default return
  }, [initialData, selectedPatientId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TaskFormData, string>> = {};
    if (!formData.titel?.trim()) {
      newErrors.titel = 'Titel is verplicht.';
    }
    if (!formData.type) {
      newErrors.type = 'Taaktype is verplicht.';
    }
    if (!formData.herhaal_patroon) {
      newErrors.herhaal_patroon = 'Herhaalpatroon is verplicht.';
    }
    // Voeg hier meer validaties toe indien nodig
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPatientId) { // Dit zou niet mogen gebeuren als het formulier alleen getoond wordt met een geselecteerde patiënt
      addNotification({ type: 'error', message: 'Geen patiënt geselecteerd.' });
      return;
    }
    if (!validateForm()) {
      return;
    }

    const taskPayload: Partial<Task> = {
      ...formData,
      // user_id en specialist_id worden alleen meegestuurd bij NIEUWE taken.
      // Bij bewerken worden deze niet gewijzigd via dit formulier.
      // De API (PUT /api/tasks/[id]) moet de user_id en specialist_id van de bestaande taak respecteren.
      duur: formData.duur && String(formData.duur).trim() !== '' ? parseInt(String(formData.duur), 10) : undefined,
      hartslag_doel: formData.hartslag_doel && String(formData.hartslag_doel).trim() !== '' ? parseInt(String(formData.hartslag_doel), 10) : undefined,
    };

    if (isEditing && currentTaskId) {
      taskPayload.id = currentTaskId;
      // Belangrijk: stuur user_id en specialist_id NIET mee in de payload voor een UPDATE,
      // tenzij je ze expliciet wilt kunnen wijzigen. De API zou dit moeten afdwingen.
      // delete taskPayload.user_id; // Wordt al niet meegenomen door TaskFormData Omit
      // delete taskPayload.specialist_id;
    } else {
      // Alleen voor nieuwe taken:
      taskPayload.user_id = selectedPatientId;
      taskPayload.specialist_id = specialistId;
    }

    Object.keys(taskPayload).forEach(key => {
      const typedKey = key as keyof Partial<Task>;
      if (taskPayload[typedKey] === undefined) {
        delete taskPayload[typedKey];
      }
    });

    console.log(`[CreateTaskAssignmentForm] Submitting taskPayload (isEditing: ${isEditing}):`, JSON.stringify(taskPayload, null, 2));

    upsertTask(taskPayload, {
      onSuccess: (_updatedOrCreatedTask: unknown) => {
        const message = isEditing ? 'Taak succesvol bijgewerkt!' : 'Taak succesvol aangemaakt!';
        addNotification({ type: 'success', message });
        setFormData(defaultFormData); // Reset naar default
        setIsEditing(false);
        setCurrentTaskId(null);
        setErrors({});
        if (onTaskUpserted) onTaskUpserted();
      },
      onError: (error: any) => {
        const message = isEditing ? 'Fout bij bijwerken taak.' : 'Fout bij aanmaken taak.';
        addNotification({ type: 'error', message: error?.userMessage || message });
      }
    });
  };

  // Toon het formulier alleen als een patiënt is geselecteerd,
  // of als we aan het bewerken zijn (initialData is dan gezet).
  if (!selectedPatientId && !isEditing) {
    return (
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md text-center">
        <p className="text-blue-700">Selecteer een patiënt om een taak aan te maken of te bewerken.</p>
      </div>
    );
  }

  // Als initialData is meegegeven maar de selectedPatientId komt niet overeen, toon dan niets of een melding.
  // Dit voorkomt dat je een taak van patiënt A bewerkt terwijl patiënt B geselecteerd is.
  if (initialData && selectedPatientId && initialData.user_id !== selectedPatientId) {
    return (
      <div className="mt-6 p-4 bg-yellow-100 border border-yellow-300 rounded-md text-center">
        <p className="text-yellow-700">De geselecteerde taak behoort niet tot de geselecteerde patiënt. Maak een nieuwe selectie.</p>
      </div>
    );
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6 border-t pt-6">
      <h3 className="text-lg font-medium leading-6 text-gray-900">
        {isEditing ? `Taak "${formData.titel || ''}" Bewerken` : 'Nieuwe Taak Toewijzen'}
      </h3>
      <div>
        <label htmlFor="titel" className="block text-sm font-medium text-gray-700">Titel</label>
        <input
          type="text"
          name="titel"
          id="titel"
          value={formData.titel || ''}
          onChange={handleChange}
          className={`mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.titel ? 'border-red-500' : ''}`}
        />
        {errors.titel && <p className="mt-1 text-sm text-red-600">{errors.titel}</p>}
      </div>

      <div>
        <label htmlFor="beschrijving" className="block text-sm font-medium text-gray-700">Beschrijving (optioneel)</label>
        <textarea
          name="beschrijving"
          id="beschrijving"
          rows={3}
          value={formData.beschrijving || ''}
          onChange={handleChange}
          className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type Taak</label>
          <select
            name="type"
            id="type"
            value={formData.type || 'taak'}
            onChange={handleChange}
            className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md ${errors.type ? 'border-red-500' : ''}`}
          >
            <option value="taak">Taak (algemeen)</option>
            <option value="opdracht">Opdracht (specifiek)</option>
          </select>
          {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
        </div>
        <div>
          <label htmlFor="herhaal_patroon" className="block text-sm font-medium text-gray-700">Herhaalpatroon</label>
          <select
            name="herhaal_patroon"
            id="herhaal_patroon"
            value={formData.herhaal_patroon || 'eenmalig'}
            onChange={handleChange}
            className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md ${errors.herhaal_patroon ? 'border-red-500' : ''}`}
          >
            <option value="eenmalig">Eenmalig</option>
            <option value="dagelijks">Dagelijks</option>
            <option value="wekelijks">Wekelijks</option>
            {/* Voeg meer opties toe indien nodig */}
          </select>
          {errors.herhaal_patroon && <p className="mt-1 text-sm text-red-600">{errors.herhaal_patroon}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="duur" className="block text-sm font-medium text-gray-700">Duur (minuten, optioneel)</label>
        <input
          type="number"
          name="duur"
          id="duur"
          value={formData.duur || ''}
          onChange={handleChange}
          placeholder="Bijv. 30"
          className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label htmlFor="hartslag_doel" className="block text-sm font-medium text-gray-700">Hartslag Doel (bpm, optioneel)</label>
        <input
          type="number"
          name="hartslag_doel"
          id="hartslag_doel"
          value={formData.hartslag_doel || ''}
          onChange={handleChange}
          placeholder="Bijv. 120"
          className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label htmlFor="notities" className="block text-sm font-medium text-gray-700">Extra Notities voor Patiënt (optioneel)</label>
        <textarea
          name="notities"
          id="notities"
          rows={2}
          value={formData.notities || ''}
          onChange={handleChange}
          className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
        />
      </div>

      {/* TODO: Labels (bijv. met een multi-select of tag input) */}
      {/* TODO: dagen_van_week (voor wekelijks herhalen) */}
      {/* TODO: metingen (welke sensoren te gebruiken) */}

      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading || (!selectedPatientId && !isEditing)} // Disable als geen patiënt geselecteerd (voor nieuwe taak)
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Bezig...' : (isEditing ? 'Taak Bijwerken' : 'Taak Aanmaken en Toewijzen')}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={() => {
              setFormData(defaultFormData);
              setIsEditing(false);
              setCurrentTaskId(null);
              // Optioneel: roep een prop aan om de parent te laten weten dat editing is geannuleerd
            }}
            className="mt-2 w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Annuleren (Bewerken)
          </button>
        )}
      </div>
    </form>
  );
}
