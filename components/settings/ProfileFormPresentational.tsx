'use client';
import { AlertMessage } from '@/components/common/AlertMessage';
import { ErrorMessage } from '@/lib/error-handler';
import React, { FormEvent } from 'react';

export interface ProfileFormData {
  voornaam: string;
  achternaam: string;
  postcode: string;
  gemeente: string;
  geboortedatum: string;
}

interface ProfileFormPresentationalProps {
  formData: ProfileFormData;
  avatarUrl: string | null;
  uploadingAvatar: boolean;
  isUpdatingProfile: boolean;
  profileType: string | undefined;
  updateProfileError: ErrorMessage | null;
  isUpdateProfileError: boolean;
  isUpdateProfileSuccess: boolean;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export default function ProfileFormPresentational({
  formData,
  avatarUrl,
  uploadingAvatar,
  isUpdatingProfile,
  profileType,
  updateProfileError,
  isUpdateProfileError,
  isUpdateProfileSuccess,
  onFormChange,
  onAvatarUpload,
  onSubmit,
  onCancel,
}: ProfileFormPresentationalProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Mijn Profiel</h2>

      {isUpdateProfileError && updateProfileError && !isUpdateProfileSuccess && (
        <AlertMessage type="error" title="Opslaan Mislukt" message={updateProfileError.userMessage} className="mb-4" />
      )}

      <form onSubmit={onSubmit}>
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 relative">
            <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profielfoto" className="h-full w-full object-cover" />
              ) : (
                <svg className="h-12 w-12 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center cursor-pointer text-white shadow-md hover:bg-purple-700"
              aria-label="Upload profielfoto"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <input
                id="avatar-upload" type="file" accept="image/*" className="hidden"
                onChange={onAvatarUpload} disabled={uploadingAvatar}
                aria-labelledby="avatar-upload-label" // Technically the label wraps it, but explicit can help
              />
            </label>
            <span id="avatar-upload-label" className="sr-only">Upload profielfoto</span>
          </div>
          {uploadingAvatar && <p className="text-sm text-gray-500 animate-pulse">Profielfoto uploaden...</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="voornaam" className="block text-sm font-medium text-gray-700 mb-1">Voornaam</label>
            <input id="voornaam" name="voornaam" type="text" value={formData.voornaam} onChange={onFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" required />
          </div>
          <div>
            <label htmlFor="achternaam" className="block text-sm font-medium text-gray-700 mb-1">Achternaam</label>
            <input id="achternaam" name="achternaam" type="text" value={formData.achternaam} onChange={onFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
            <input id="postcode" name="postcode" type="text" value={formData.postcode} onChange={onFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label htmlFor="gemeente" className="block text-sm font-medium text-gray-700 mb-1">Gemeente</label>
            <input id="gemeente" name="gemeente" type="text" value={formData.gemeente} onChange={onFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="geboortedatum" className="block text-sm font-medium text-gray-700 mb-1">Geboortedatum</label>
          <input id="geboortedatum" name="geboortedatum" type="date" value={formData.geboortedatum} onChange={onFormChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>

        {profileType && (
          <div className="mb-6">
            <label htmlFor="accountType" className="block text-sm font-medium text-gray-700 mb-1">Account type</label>
            <input id="accountType" type="text" value={profileType.charAt(0).toUpperCase() + profileType.slice(1)} readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 focus:outline-none" aria-label="Account type (niet wijzigbaar)" />
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isUpdatingProfile || uploadingAvatar}>
            Annuleren
          </button>
          <button type="submit" disabled={isUpdatingProfile || uploadingAvatar}
            className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${(isUpdatingProfile || uploadingAvatar) ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
              }`}
          >
            {(isUpdatingProfile || uploadingAvatar) ? 'Bezig met opslaan...' : 'Profiel Opslaan'}
          </button>
        </div>
      </form>
    </div>
  );
}
