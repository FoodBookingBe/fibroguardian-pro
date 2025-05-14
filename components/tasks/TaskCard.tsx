'use client';
import { useState, ReactElement } from 'react'; // Added ReactElement
import Link from 'next/link';
import { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onDelete?: (taskId: string) => void | Promise<void>; // Allow async delete
  onUpdateStatus?: (taskId: string, newStatus: string) => void | Promise<void>; // For future status updates
}

export default function TaskCard({ task, onDelete, onUpdateStatus }: TaskCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // Helper voor het formatteren van datum
  const formatDate = (dateString: Date | string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-BE', {
      day: '2-digit',
      month: 'short', // Using short month name
      year: 'numeric'
    });
  };
  
  // Helper voor het bepalen van het taakicoon
  const getTaskIcon = (): ReactElement => {
    if (task.type === 'taak') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    } else { // 'opdracht'
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }
  };
  
  // Handler voor delete bevestiging
  const handleDeleteClick = async () => {
    if (confirmDelete && onDelete) {
      try {
        await onDelete(task.id);
        setConfirmDelete(false); // Reset on successful delete
      } catch (error) {
        console.error("Failed to delete task:", error);
        // Optionally show an error message to the user
      }
    } else {
      setConfirmDelete(true);
      // Set a timeout to auto-cancel confirmation after a few seconds
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-200 ease-in-out">
      <div className="flex items-start mb-3">
        <div className="flex-shrink-0 mt-1 mr-3">
          {getTaskIcon()}
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-medium text-gray-900 mb-1">{task.titel}</h3>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`px-2 py-0.5 rounded-full font-medium ${ // Adjusted padding
              task.type === 'taak' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
            }`}>
              {task.type === 'taak' ? 'Taak' : 'Opdracht'}
            </span>
            {task.herhaal_patroon && (
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium capitalize">
                {task.herhaal_patroon}
              </span>
            )}
            {task.duur && (
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                {task.duur} min
              </span>
            )}
          </div>
        </div>
      </div>
      
      {task.beschrijving && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{task.beschrijving}</p> // Added line-clamp
      )}
      
      {task.labels && task.labels.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {task.labels.map((label, index) => (
              <span key={index} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full"> {/* Changed style */}
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex flex-wrap text-xs text-gray-500 mb-4 items-center">
        <span className="mr-3">Gemaakt: {formatDate(task.created_at)}</span>
        {task.specialist_id && (
          <span className="flex items-center text-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Specialist
          </span>
        )}
      </div>
      
      <div className="flex justify-between items-center pt-3 border-t border-gray-100"> {/* Adjusted padding */}
        <div className="flex space-x-3"> {/* Increased space */}
          <Link 
            href={`/taken/${task.id}`} // Assuming this is the view details page
            className="text-gray-500 hover:text-purple-600 transition-colors"
            aria-label={`Bekijk details van taak ${task.titel}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>
          
          <Link 
            href={`/taken/${task.id}/bewerken`} // Assuming this is the edit page
            className="text-gray-500 hover:text-blue-600 transition-colors"
            aria-label={`Bewerk taak ${task.titel}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Link>
          
          {onDelete && ( // Only show delete if handler is provided
            <button
              type="button"
              onClick={handleDeleteClick}
              className={`transition-colors ${
                confirmDelete ? 'text-red-600 hover:text-red-700' : 'text-gray-500 hover:text-red-600'
              }`}
              aria-label={confirmDelete ? `Bevestig verwijderen van taak ${task.titel}` : `Verwijder taak ${task.titel}`}
              aria-live={confirmDelete ? "assertive" : "off"} // Announce confirmation
            >
              {confirmDelete ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099A.75.75 0 007.5 3.75v1.5H4.5a.75.75 0 000 1.5h.09L5.37 15.09A2.25 2.25 0 007.618 17h4.764a2.25 2.25 0 002.248-1.911l.78-8.34h.09a.75.75 0 000-1.5H12.5v-1.5a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.743-.651zM9 3.75V5.25h2V3.75H9z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          )}
        </div>
        
        <Link
          href={`/taken/${task.id}/start`} // Assuming this route exists
          className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-md hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2" // Adjusted padding and added focus styles
        >
          Starten
        </Link>
      </div>
    </div>
  );
}