'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Task } from '@/types';

interface DailyPlannerProps {
  tasks: Task[];
  userId: string; // Added userId for potential future use, e.g., linking to user-specific task actions
}

export default function DailyPlanner({ tasks, userId }: DailyPlannerProps) {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  const filterTasks = (filter: string) => {
    setActiveFilter(filter);
  };
  
  // Filter de taken
  const filteredTasks = tasks.filter(task => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'taak') return task.type === 'taak';
    if (activeFilter === 'opdracht') return task.type === 'opdracht';
    return true; // Should not happen with current filters
  });
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-wrap items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Dagplanning</h2> {/* Adjusted text color for better contrast/style */}
        
        <div className="flex space-x-2 mt-2 sm:mt-0">
          <button
            onClick={() => filterTasks('all')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeFilter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-pressed={activeFilter === 'all' ? "true" : "false"}
            aria-label="Toon alle taken"
          >
            Alles
          </button>
          <button
            onClick={() => filterTasks('taak')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeFilter === 'taak'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-pressed={activeFilter === 'taak' ? "true" : "false"}
            aria-label="Toon alleen taken"
          >
            Taken
          </button>
          <button
            onClick={() => filterTasks('opdracht')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeFilter === 'opdracht'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-pressed={activeFilter === 'opdracht' ? "true" : "false"}
            aria-label="Toon alleen opdrachten"
          >
            Opdrachten
          </button>
        </div>
      </div>
      
      {filteredTasks.length > 0 ? (
        <ul className="space-y-3">
          {filteredTasks.map(task => (
            <li key={task.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
              <div className="flex items-start space-x-3"> {/* Added space-x for better layout */}
                <div className="h-6 w-6 mt-0.5 flex-shrink-0">
                  {task.type === 'taak' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="text-md font-medium text-gray-900">{task.titel}</h3>
                  {task.beschrijving && (
                    <p className="text-sm text-gray-600 mt-1">{task.beschrijving}</p>
                  )}
                  <div className="flex items-center mt-2 text-xs text-gray-500 space-x-3"> {/* Added space-x */}
                    {task.duur && (
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {task.duur} min
                      </span>
                    )}
                    {task.herhaal_patroon && task.herhaal_patroon !== 'eenmalig' && (
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {task.herhaal_patroon.charAt(0).toUpperCase() + task.herhaal_patroon.slice(1)} {/* Capitalize */}
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-auto flex-shrink-0"> {/* Changed ml-4 to ml-auto for better alignment */}
                  <Link
                    href={`/taken/${task.id}/start`} // Assuming a route to start/log a task
                    className="px-3 py-1 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                  >
                    Starten
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            {activeFilter === 'all' ? 'Geen taken gepland voor vandaag' : 
             activeFilter === 'taak' ? 'Geen taken van het type "Taak" gepland voor vandaag' :
             'Geen taken van het type "Opdracht" gepland voor vandaag'}
          </p>
          <Link
            href="/taken/nieuw" // Assuming a route to create a new task
            className="btn-primary" // Using global style
          >
            Taak toevoegen
          </Link>
        </div>
      )}
    </div>
  );
}