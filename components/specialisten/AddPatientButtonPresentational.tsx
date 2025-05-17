'use client';
import React, { FormEvent } from 'react';
import { AlertMessage } from '@/components/common/AlertMessage';
import { ErrorMessage } from '@/lib/error-handler';

interface AddPatientButtonPresentationalProps {
  showModal: boolean;
  email: string;
  isLoading: boolean;
  error: ErrorMessage | null;
  isSuccess: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
}

export default function AddPatientButtonPresentational({
  showModal,
  email,
  isLoading,
  error,
  isSuccess,
  onOpenModal,
  onCloseModal,
  onEmailChange,
  onSubmit,
}: AddPatientButtonPresentationalProps) {
  return (
    <>
      <button
        onClick={onOpenModal}
        className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
      >
        Patiënt Toevoegen
      </button>
      
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Patiënt Toevoegen</h3>
              
              {error && (
                <AlertMessage type="error" message={error.userMessage || 'Kon patiënt niet toevoegen.'} />
              )}
              {isSuccess && !error && (
                <AlertMessage type="success" message="Patiënt succesvol toegevoegd! De lijst wordt vernieuwd." />
              )}
              
              <form onSubmit={onSubmit}>
                <div className="mb-4">
                  <label htmlFor="patient-email" className="block text-sm font-medium text-gray-700 mb-1">
                    E-mailadres van patiënt
                  </label>
                  <input
                    id="patient-email"
                    type="email"
                    value={email}
                    onChange={onEmailChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                    disabled={isLoading}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Voer het e-mailadres in waarmee de patiënt is geregistreerd.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={onCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={isLoading}
                  >
                    Annuleren
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-md text-white font-medium ${
                      isLoading ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                    } transition-colors`}
                  >
                    {isLoading ? 'Bezig...' : 'Toevoegen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}