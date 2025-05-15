'use client';
import { useState } from 'react';
import Link from 'next/link';

interface Patient {
  id: string;
  voornaam?: string;
  achternaam?: string;
  postcode?: string;
  gemeente?: string;
  avatar_url?: string;
  geboortedatum?: string;
  created_at: Date | string;
}

interface PatientListProps {
  patients: Patient[];
  onAddPatient?: () => void;
}

export default function PatientList({ patients, onAddPatient }: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'naam' | 'datum'>('naam');
  
  // Filter en sorteer patienten
  const filteredPatients = patients
    .filter(patient => {
      const fullName = `${patient.voornaam || ''} ${patient.achternaam || ''}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase()) || 
             (patient.postcode && patient.postcode.includes(searchTerm));
    })
    .sort((a, b) => {
      if (sortBy === 'naam') {
        const nameA = `${a.voornaam || ''} ${a.achternaam || ''}`.toLowerCase();
        const nameB = `${b.voornaam || ''} ${b.achternaam || ''}`.toLowerCase();
        return nameA.localeCompare(nameB);
      } else { // Sort by date
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
      }
    });
  
  if (patients.length === 0 && !onAddPatient) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500">Geen patiënten gevonden</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-lg font-semibold mb-3 sm:mb-0">Patiënten ({patients.length})</h2>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
          {/* Zoekbalk */}
          <div className="relative">
            <input
              type="text"
              placeholder="Zoek op naam of postcode"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* Sorteer opties */}
          <div className="flex space-x-2">
            <button
              onClick={() => setSortBy('naam')}
              className={`px-3 py-1 rounded-md text-sm ${
                sortBy === 'naam'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Naam
            </button>
            <button
              onClick={() => setSortBy('datum')}
              className={`px-3 py-1 rounded-md text-sm ${
                sortBy === 'datum'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Meest recent
            </button>
          </div>
          
          {/* Voeg patiënt toe knop */}
          {onAddPatient && (
            <button
              onClick={onAddPatient}
              className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
            >
              Patiënt Toevoegen
            </button>
          )}
        </div>
      </div>
      
      {filteredPatients.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500">Geen patiënten gevonden die overeenkomen met uw zoekopdracht</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Naam
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Locatie
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leeftijd
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sinds
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Acties</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map(patient => {
                // Bereken leeftijd
                const leeftijd = patient.geboortedatum 
                  ? Math.floor((new Date().getTime() - new Date(patient.geboortedatum).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                  : null;
                
                // Formatteer datum
                const sindsDate = new Date(patient.created_at);
                const sinds = sindsDate.toLocaleDateString('nl-BE', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });
                
                return (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                          {patient.avatar_url ? (
                            <img 
                              src={patient.avatar_url} 
                              alt={`${patient.voornaam} ${patient.achternaam}`}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-purple-800 font-medium">
                              {patient.voornaam?.charAt(0) || ''}
                              {patient.achternaam?.charAt(0) || ''}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {patient.voornaam} {patient.achternaam}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.postcode} {patient.gemeente}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{leeftijd ? `${leeftijd} jaar` : '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sinds}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        href={`/specialisten/patient/${patient.id}`}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}