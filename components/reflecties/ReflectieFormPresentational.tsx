'use client';
import React, { FormEvent } from 'react';
import { AlertMessage } from '@/components/common/AlertMessage';
import { ErrorMessage } from '@/lib/error-handler';
import { ariaProps } from '@/utils/accessibility';

export type StemmingP = 'zeer goed' | 'goed' | 'neutraal' | 'matig' | 'slecht' | 'zeer slecht';

export interface ReflectieFormState {
  datum: string;
  stemming: StemmingP;
  notitie: string;
}

interface ReflectieFormPresentationalProps {
  formState: ReflectieFormState;
  isUpserting: boolean;
  upsertError: ErrorMessage | null;
  isUpsertSuccess: boolean;
  vandaag: string;
  stemmingOpties: StemmingP[];
  stemmingKleur: (stemming: StemmingP) => string;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onStemmingSelect: (stemming: StemmingP) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  submitButtonRef: React.RefObject<HTMLButtonElement>;
}

export default function ReflectieFormPresentational({
  formState,
  isUpserting,
  upsertError,
  isUpsertSuccess,
  vandaag,
  stemmingOpties,
  stemmingKleur,
  onFormChange,
  onStemmingSelect,
  onSubmit,
  onCancel,
  submitButtonRef,
}: ReflectieFormPresentationalProps) {
  return (
    <section className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Dagelijkse Reflectie</h2>
      
      {upsertError && (
        <AlertMessage type="error" title="Opslaan Mislukt" message={upsertError.userMessage || 'Opslaan van reflectie mislukt'} />
      )}
      {isUpsertSuccess && !upsertError && ( 
         <AlertMessage type="success" title="Succes" message="Reflectie succesvol opgeslagen!" />
      )}
      
      <form onSubmit={onSubmit}>
        <div className="mb-5">
          <label htmlFor="datum" className="block text-gray-700 font-medium mb-2">Datum</label>
          <input
            type="date" id="datum" name="datum"
            value={formState.datum} onChange={onFormChange}
            max={vandaag}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">Selecteer de datum voor deze reflectie</p>
        </div>
        
        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-2">Hoe voelt u zich vandaag?</label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Stemming selectie">
            {stemmingOpties.map((stemming) => (
              <button
                key={stemming} type="button" onClick={() => onStemmingSelect(stemming)}
                className={`px-4 py-2 rounded-md transition ${
                  formState.stemming === stemming
                    ? stemmingKleur(stemming)
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                {...ariaProps.checkbox(formState.stemming === stemming)}
                aria-label={`Selecteer stemming: ${stemming}`}
              >
                {stemming}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-5">
          <label htmlFor="notitie" className="block text-gray-700 font-medium mb-2">Reflectie</label>
          <textarea
            id="notitie" name="notitie" value={formState.notitie}
            onChange={onFormChange} rows={5}
            placeholder="Schrijf hier uw reflectie voor vandaag. Hoe voelt u zich? Wat ging er goed? Wat was moeilijk?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          ></textarea>
          <p className="mt-1 text-sm text-gray-500">Dagelijkse reflecties helpen om inzicht te krijgen in uw patronen</p>
        </div>
        
        <div className="flex justify-end space-x-3 mt-8">
          <button
            type="button" onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isUpserting}
          >
            Annuleren
          </button>
          <button
            type="submit" disabled={isUpserting}
            ref={submitButtonRef}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              isUpserting ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
            } transition-colors`}
          >
            {isUpserting ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </form>
    </section>
  );
}