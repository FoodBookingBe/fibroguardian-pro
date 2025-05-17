'use client';
import React, { FormEvent } from 'react';
import { AlertMessage } from '@/components/common/AlertMessage';

interface AddSpecialistButtonPresentationalProps {
  showModal: boolean;
  email: string;
  isLoading: boolean;
  formError: string | null; // For form-level validation errors before mutation
  // Mutation success/error will be handled by global notifications via the container
  onOpenModal: () => void;
  onCloseModal: () => void;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
}

export default function AddSpecialistButtonPresentational({
  showModal,
  email,
  isLoading,
  formError,
  onOpenModal,
  onCloseModal,
  onEmailChange,
  onSubmit,
}: AddSpecialistButtonPresentationalProps) {
  return (
    <>
      <button
        onClick={onOpenModal}
        className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
      >
        Specialist Toevoegen
      </button>
      
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Specialist Toevoegen</h3>
              
              {formError && (
                <AlertMessage type="error" message={formError} className="mb-4" />
              )}
              {/* Global notifications will handle mutation success/error */}
              
              <form onSubmit={onSubmit}>
                <div className="mb-4">
                  <label htmlFor="specialist-email-input" className="block text-sm font-medium text-gray-700 mb-1">
                    E-mailadres van specialist
                  </label>
                  <input
                    id="specialist-email-input"
                    type="email"
                    value={email}
                    onChange={onEmailChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${formError && email === '' ? 'border-red-500' : 'border-gray-300'}`}
                    required
                    disabled={isLoading}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Voer het e-mailadres in waarmee de specialist is geregistreerd.
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