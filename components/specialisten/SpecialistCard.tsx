
// Fix voor ontbrekende property 'addNotification' op Element type
declare module "react" {
  interface Element {
    addNotification?: unknown;
  }
}
'use client'; // Client component if it has interactive elements like delete button
import React from 'react';
import { Profile } from '@/types';
import { useNotification } from '@/context/NotificationContext'; // For potential local feedback

interface SpecialistCardProps {
  specialist: Profile;
  onDelete?: (specialistId: string) => void;
  isDeleting?: boolean; // To show loading state on the delete button
}

function SpecialistCard({ specialist, onDelete, isDeleting }: SpecialistCardProps) {
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  // const { addNotification } = useNotification(); // If local notifications are needed

  const handleDeleteClick = () => {
    if (!onDelete) return;

    if (confirmDelete) {
      onDelete(specialist.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000); // Auto-reset confirmation
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-200 ease-in-out flex flex-col justify-between">
      <div>
        <div className="flex items-center mb-3">
          <img 
            src={specialist.avatar_url || '/icons/icon-128x128.png'} // Fallback avatar
            alt={`Avatar van ${specialist.voornaam} ${specialist.achternaam}`}
            className="h-12 w-12 rounded-full mr-4 object-cover"
          />
          <div>
            <h3 className="text-lg font-semibold text-purple-700">
              {specialist.voornaam} {specialist.achternaam}
            </h3>
            <p className="text-sm text-gray-600">Specialist</p> {/* Assuming type is always specialist here */}
          </div>
        </div>
        {/* Add more specialist details if available and relevant */}
        {/* Example: <p className="text-sm text-gray-500">Contact: {specialist.email_from_profiles_table}</p> */}
      </div>
      
      {onDelete && (
        <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
              confirmDelete
                ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400'
                : 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600 focus:ring-gray-400'
            } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={confirmDelete ? `Bevestig verwijderen van ${specialist.voornaam}` : `Verwijder ${specialist.voornaam}`}
          >
            {isDeleting ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : confirmDelete ? 'Bevestig' : 'Verwijder Relatie'}
          </button>
        </div>
      )}
    </div>
  );
}

export default React.memo(SpecialistCard);
