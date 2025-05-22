import React from 'react';

import { Specialist } from '@/types'; // Assuming Specialist type is defined in types/index.ts or similar

interface SpecialistsListProps {
  specialists: Specialist[];
  onRemove: (specialistId: string) => void;
}

export default function SpecialistsList({ specialists, onRemove }: SpecialistsListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {specialists.map(specialist => (
        <div key={specialist.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {specialist.voornaam} {specialist.achternaam}
            </h2>
            <p className="text-gray-600 mb-4">{specialist.email}</p>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Toegangsrechten:</h3>
              <ul className="text-sm text-gray-600">
                {specialist.toegangsrechten.includes('view_tasks') && (
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Kan uw taken bekijken
                  </li>
                )}
                {specialist.toegangsrechten.includes('view_logs') && (
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Kan uw logs bekijken
                  </li>
                )}
                {specialist.toegangsrechten.includes('create_tasks') && (
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Kan taken voor u aanmaken
                  </li>
                )}
              </ul>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => onRemove(specialist.id)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
