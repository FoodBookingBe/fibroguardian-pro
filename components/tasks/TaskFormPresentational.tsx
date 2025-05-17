'use client';
import React, { FormEvent } from 'react';
import { AlertMessage } from '@/components/common/AlertMessage';
import { Task } from '@/types'; // Assuming Task type is defined
import { ErrorMessage } from '@/lib/error-handler';

// This defines the shape of the data the form inputs will manage
export interface TaskFormData {
  type: 'taak' | 'opdracht';
  titel: string;
  beschrijving: string;
  duur: string; // Kept as string for input compatibility
  hartslag_doel: string; // Kept as string for input compatibility
  herhaal_patroon: 'eenmalig' | 'dagelijks' | 'wekelijks' | 'maandelijks' | 'aangepast';
  dagen_van_week: string[];
  metingen: string[];
  notities: string;
  labels: string[];
}

interface TaskFormPresentationalProps {
  formState: TaskFormData;
  isEditing: boolean;
  isUpserting: boolean;
  upsertError: ErrorMessage | null;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onDayToggle: (day: string) => void;
  onMeasurementToggle: (measurement: string) => void;
  onLabelChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
}

export default function TaskFormPresentational({
  formState,
  isEditing,
  isUpserting,
  upsertError,
  onFormChange,
  onDayToggle,
  onMeasurementToggle,
  onLabelChange,
  onSubmit,
  onCancel,
}: TaskFormPresentationalProps) {
  return (
    <section id="task-form" className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">
        {isEditing ? 'Bewerk' : 'Nieuwe'} {formState.type === 'opdracht' ? 'Opdracht' : 'Taak'}
      </h2>

      {upsertError && (
        <AlertMessage type="error" message={upsertError.userMessage || 'Opslaan van taak mislukt'} />
      )}

      <form onSubmit={onSubmit}>
        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-2">Type</label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => onFormChange({ target: { name: 'type', value: 'taak' } } as any)} // Simulate event
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
              onClick={() => onFormChange({ target: { name: 'type', value: 'opdracht' } } as any)} // Simulate event
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
            onChange={onFormChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="beschrijving" className="block text-gray-700 font-medium mb-2">Beschrijving / Instructies</label>
          <textarea
            id="beschrijving" name="beschrijving" value={formState.beschrijving}
            onChange={onFormChange} rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          ></textarea>
        </div>

        <div className="mb-4">
          <label htmlFor="duur" className="block text-gray-700 font-medium mb-2">Duur (minuten)</label>
          <input
            id="duur" name="duur" type="number" min="1" max="480" value={formState.duur}
            onChange={onFormChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {formState.type === 'opdracht' && (
          <div className="mb-4">
            <label htmlFor="hartslag_doel" className="block text-gray-700 font-medium mb-2">Hartslag Doel (BPM)</label>
            <input
              id="hartslag_doel" name="hartslag_doel" type="number" min="40" max="200" value={formState.hartslag_doel}
              onChange={onFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="herhaal_patroon" className="block text-gray-700 font-medium mb-2">Herhaalpatroon</label>
          <select
            id="herhaal_patroon" name="herhaal_patroon" value={formState.herhaal_patroon}
            onChange={onFormChange}
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
                  key={day.key} type="button" onClick={() => onDayToggle(day.key)}
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
                  onChange={() => onMeasurementToggle(measurement.key)}
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
            onChange={onLabelChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Bijv. belangrijk, werk, thuis"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="notities" className="block text-gray-700 font-medium mb-2">Notities</label>
          <textarea
            id="notities" name="notities" value={formState.notities || ''}
            onChange={onFormChange} rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          ></textarea>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button" onClick={onCancel}
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