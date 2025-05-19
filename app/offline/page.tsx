import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offline | FibroGuardian',
  description: 'U bent momenteel offline. Sommige functies zijn mogelijk beperkt beschikbaar.'
};

/**
 * Offline page component
 * 
 * This page is displayed when the user is offline and tries to access a page
 * that is not cached by the service worker.
 */
export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-12 w-12 text-blue-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a3 3 0 010-5.656m-6.364 0a3 3 0 00-4.243 4.243m10.607-10.607a9 9 0 00-12.728 0" 
                />
                <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2" stroke="currentColor" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
            U bent offline
          </h1>
          
          <p className="text-gray-600 text-center mb-6">
            Het lijkt erop dat u momenteel geen internetverbinding heeft. 
            Sommige functies van FibroGuardian zijn nog steeds beschikbaar, 
            maar andere vereisen een internetverbinding.
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <h2 className="font-semibold text-blue-700 mb-2">Beschikbaar in offline modus:</h2>
              <ul className="list-disc list-inside text-blue-600 space-y-1">
                <li>Bekijk eerder geladen dashboardgegevens</li>
                <li>Toegang tot opgeslagen reflecties</li>
                <li>Bekijk uw taken en opdrachten</li>
                <li>Bekijk eerder geladen rapporten</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h2 className="font-semibold text-gray-700 mb-2">Niet beschikbaar in offline modus:</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Nieuwe gegevens synchroniseren</li>
                <li>Nieuwe reflecties toevoegen</li>
                <li>Communiceren met specialisten</li>
                <li>Nieuwe rapporten genereren</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 space-y-4">
            <Link 
              href="/dashboard"
              className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-center transition duration-150 ease-in-out"
            >
              Ga naar Dashboard
            </Link>
            
            <button 
              onClick={() => window.location.reload()}
              className="block w-full py-2 px-4 bg-white hover:bg-gray-100 text-blue-600 font-medium rounded-md text-center transition duration-150 ease-in-out border border-blue-600"
            >
              Probeer opnieuw te verbinden
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-sm text-gray-500 text-center">
            FibroGuardian werkt aan verbeterde offline functionaliteit. 
            Uw gegevens worden lokaal opgeslagen en gesynchroniseerd zodra u weer online bent.
          </p>
        </div>
      </div>
    </div>
  );
}
