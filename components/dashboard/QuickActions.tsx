'use client';
import Link from 'next/link';
import { ReactElement } from 'react'; // Import ReactElement for icon type

interface ActionItem {
  title: string;
  description: string;
  icon: ReactElement; // Type for JSX element
  link: string;
  color: string; // Tailwind background color class
}

export default function QuickActions() {
  const actions: ActionItem[] = [
    {
      title: 'Nieuwe Taak',
      description: 'Voeg een nieuwe taak toe aan uw planning',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      link: '/taken/nieuw', // Assuming this route exists
      color: 'bg-blue-500'
    },
    {
      title: 'Nieuwe Opdracht',
      description: 'Voeg een nieuwe opdracht toe voor training',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      link: '/opdrachten/nieuw', // Assuming this route exists
      color: 'bg-green-500'
    },
    {
      title: 'Reflectie Toevoegen',
      description: 'Voeg een reflectie toe over uw dag',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      link: '/reflecties/nieuw', // Assuming this route exists
      color: 'bg-purple-500'
    },
    {
      title: 'Genereer Rapport',
      description: 'Maak een rapport van uw gezondheidsgegevens',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      link: '/rapporten/nieuw', // Assuming this route exists
      color: 'bg-amber-500'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Snelle Acties</h2> {/* Adjusted text color */}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.link}
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all group text-center" /* Added text-center */
          >
            <div className={`w-12 h-12 ${action.color} text-white rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              {action.icon}
            </div>
            <h3 className="font-medium text-gray-900 mb-1 text-sm">{action.title}</h3> {/* Adjusted font size */}
            <p className="text-xs text-gray-500">{action.description}</p> {/* Adjusted font size */}
          </Link>
        ))}
      </div>
    </div>
  );
}