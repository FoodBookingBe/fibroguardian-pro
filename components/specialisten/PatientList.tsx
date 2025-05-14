'use client';
import { useState, ChangeEvent } from 'react'; // Added ChangeEvent
import Link from 'next/link';
import { Profile } from '@/types';

interface PatientListProps {
  patients: Profile[];
  onAddPatient?: () => void; // Callback for adding a new patient
}

export default function PatientList({ patients, onAddPatient }: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'naam' | 'datum'>('naam');
  
  const filteredPatients = patients
    .filter(patient => {
      const fullName = `${patient.voornaam || ''} ${patient.achternaam || ''}`.toLowerCase();
      const postcode = patient.postcode || '';
      const searchLower = searchTerm.toLowerCase();
      return fullName.includes(searchLower) || postcode.includes(searchLower);
    })
    .sort((a, b) => {
      if (sortBy === 'naam') {
        const nameA = `${a.voornaam || ''} ${a.achternaam || ''}`.toLowerCase();
        const nameB = `${b.voornaam || ''} ${b.achternaam || ''}`.toLowerCase();
        return nameA.localeCompare(nameB);
      } else { // Sort by created_at date (newest first)
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA; 
      }
    });
  
  if (patients.length === 0 && !onAddPatient) { // Show only if no patients and no add function
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Geen patiënten gevonden</h2>
        <p className="text-gray-500">Voeg uw eerste patiënt toe om te beginnen.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Mijn Patiënten <span className="text-base font-normal text-gray-500">({filteredPatients.length})</span>
        </h2>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-grow sm:flex-grow-0">
            <input
              type="text"
              placeholder="Zoek naam of postcode..."
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="form-input pl-10 w-full sm:w-64" // Using global style
              aria-label="Zoek patiënten"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sorteer op:</span>
            <button
              onClick={() => setSortBy('naam')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                sortBy === 'naam' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              aria-pressed={sortBy === 'naam' ? "true" : "false"}
            >
              Naam
            </button>
            <button
              onClick={() => setSortBy('datum')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                sortBy === 'datum' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              aria-pressed={sortBy === 'datum' ? "true" : "false"}
            >
              Recent
            </button>
          </div>
          
          {onAddPatient && (
            <button
              onClick={onAddPatient}
              className="btn-primary whitespace-nowrap" // Using global style
            >
              Nieuwe Patiënt
            </button>
          )}
        </div>
      </div>
      
      {filteredPatients.length === 0 && searchTerm && (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500">Geen patiënten gevonden die overeenkomen met "{searchTerm}"</p>
        </div>
      )}

      {filteredPatients.length === 0 && !searchTerm && patients.length > 0 && (
         <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500">Alle patiënten zijn uitgefilterd.</p>
        </div>
      )}

      {filteredPatients.length > 0 && (
        <div className="overflow-x-auto -mx-6"> {/* Negative margin to allow full bleed */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patiënt</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Locatie</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Leeftijd</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sinds</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acties</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map(patient => {
                const leeftijd = patient.geboortedatum 
                  ? Math.floor((new Date().getTime() - new Date(patient.geboortedatum).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                  : null;
                const sindsDate = new Date(patient.created_at);
                const sinds = sindsDate.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' });
                
                return (
                  <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-semibold">
                          {patient.avatar_url ? (
                            <img src={patient.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover"/>
                          ) : (
                            <span>{patient.voornaam?.charAt(0)}{patient.achternaam?.charAt(0)}</span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{patient.voornaam} {patient.achternaam}</div>
                          <div className="text-xs text-gray-500 sm:hidden">{patient.postcode} {patient.gemeente}</div> {/* Show location on small screens here */}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">{patient.postcode} {patient.gemeente}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{leeftijd ? `${leeftijd} jr` : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sinds}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/specialisten/patient/${patient.id}`} className="text-purple-600 hover:text-purple-800 transition-colors">
                        Bekijk Details
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