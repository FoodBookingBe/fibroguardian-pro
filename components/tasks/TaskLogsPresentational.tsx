'use client';

import Link from 'next/link';

import { AlertMessage } from '@/components/common/AlertMessage';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorMessage } from '@/lib/error-handler';
import { RecentLogWithTaskTitle } from '@/types'; // Import RecentLogWithTaskTitle from types
import { formatDate as utilFormatDate } from '@/utils/validation'; // Import formatDate from utils

interface TaskLogsPresentationalProps {
  logsToDisplay: RecentLogWithTaskTitle[];
  isLoading: boolean;
  isError: boolean;
  error: ErrorMessage | null;
  expandedLogId: string | null;
  onToggleExpand: (id: string) => void;
  // Removed calculateDuration prop
  limit: number;
  taskId?: string; // For "Bekijk alle logs" link context
  className?: string;
  title?: string; // Allow custom title
}

export default function TaskLogsPresentational({
  logsToDisplay,
  isLoading,
  isError,
  error,
  expandedLogId,
  onToggleExpand,
  // Removed calculateDuration from destructuring
  limit,
  taskId,
  className = '',
  title = "Activiteiten Logs"
}: TaskLogsPresentationalProps): JSX.Element {

  // Define calculateDuration directly in this component
  const calculateDuration = (startTime?: Date | string, endTime?: Date | string): string => {
    if (!startTime || !endTime) return 'Onbekend';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    if (durationMs < 0) return 'Ongeldig'; // Should not happen
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading && logsToDisplay.length === 0) {
    return (
      <div className={`${className} rounded-lg bg-white p-6 shadow-md`}>
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        <SkeletonLoader count={limit > 5 ? 5 : limit} type="logs" />
      </div>
    );
  }

  if (isError && error) {
    return (
      <div className={`${className} rounded-lg bg-white p-6 shadow-md`}>
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        <AlertMessage message={error.userMessage || 'Kon de logs niet ophalen.'} title="Fout bij laden logs" type="error" />
      </div>
    );
  }

  if (logsToDisplay.length === 0) {
    return (
      <div className={`${className} rounded-lg bg-white p-6 shadow-md`}>
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        <div className="rounded-lg border-2 border-dashed border-gray-200 p-4 text-center">
          <p className="text-gray-500">Geen activiteiten logs gevonden</p>
          {!taskId && ( // Only show general link if not specific to a task
            <Link className="mt-2 inline-block text-sm font-medium text-purple-600 hover:text-purple-800" href="/taken/logs">
              Bekijk alle logs
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} rounded-lg bg-white p-6 shadow-md`}>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="space-y-3">
        {logsToDisplay.map(log => (
          <div key={log.id} className="overflow-hidden rounded-lg border transition-all duration-200">
            <button
              type="button"
              onClick={() => onToggleExpand(log.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset hover:bg-gray-50"
              aria-expanded={expandedLogId === log.id} // Pass boolean directly
              aria-controls={`log-details-${log.id}`}
            >
              <div>
                <h3 className="font-medium text-gray-900">
                  {log.tasks?.titel || 'Onbekende taak'}
                </h3>
                <p className="text-sm text-gray-500">
                  {utilFormatDate(log.start_tijd)} {/* Use utilFormatDate */}
                  {log.eind_tijd && ` - ${utilFormatDate(log.eind_tijd)}`} {/* Use utilFormatDate */}
                </p>
              </div>
              <div className="flex items-center">
                {log.eind_tijd ? (
                  <span className="mr-2 rounded-full bg-green-100 px-2 py-0.5 text-sm text-green-800">Voltooid</span>
                ) : (
                  <span className="mr-2 rounded-full bg-yellow-100 px-2 py-0.5 text-sm text-yellow-800">Actief</span>
                )}
                <svg aria-hidden="true" className={`size-5 text-gray-400 transition-transform duration-200 ${expandedLogId === log.id ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" fillRule="evenodd" />
                </svg>
              </div>
            </button>

            {expandedLogId === log.id && (
              <div id={`log-details-${log.id}`} className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                <div className="mb-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-1 text-xs font-medium uppercase text-gray-500">Taak Details</h4>
                    {log.tasks && (
                      <div className="space-y-1">
                        <p className="text-sm"><span className="font-medium">Type:</span> {log.tasks.type === 'taak' ? 'Taak' : 'Opdracht'}</p>
                        {log.eind_tijd && <p className="text-sm"><span className="font-medium">Voltooid op:</span> {utilFormatDate(log.eind_tijd)}</p>} {/* Added "Voltooid op" */}
                        <p className="text-sm"><span className="font-medium">Werkelijke duur:</span> {log.eind_tijd ? calculateDuration(log.start_tijd, log.eind_tijd) : 'Nog bezig'}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="mb-1 text-xs font-medium uppercase text-gray-500">Metingen</h4>
                    <div className="space-y-1">
                      {log.energie_voor !== null && (<p className="text-sm"><span className="font-medium">Energie voor:</span> {log.energie_voor}/20</p>)}
                      {log.energie_na !== null && (<p className="text-sm"><span className="font-medium">Energie na:</span> {log.energie_na}/20</p>)}
                      {log.pijn_score !== null && (<p className="text-sm"><span className="font-medium">Pijn:</span> {log.pijn_score}/20</p>)}
                      {log.vermoeidheid_score !== null && (<p className="text-sm"><span className="font-medium">Vermoeidheid:</span> {log.vermoeidheid_score}/20</p>)}
                      {log.stemming && (<p className="text-sm"><span className="font-medium">Stemming:</span> {log.stemming}</p>)}
                      {log.hartslag !== null && (<p className="text-sm"><span className="font-medium">Hartslag:</span> {log.hartslag} bpm</p>)} {/* Added hartslag */}
                    </div>
                  </div>
                </div>
                {log.notitie && (<div className="mb-3"><h4 className="mb-1 text-xs font-medium uppercase text-gray-500">Notitie</h4><p className="whitespace-pre-wrap text-sm text-gray-700">{log.notitie}</p></div>)}
                {log.ai_validatie && (
                  <div className="rounded-md border border-purple-200 bg-purple-50 p-3">
                    <div className="mb-1 flex items-center text-sm font-medium text-purple-700">
                      <svg aria-hidden="true" className="mr-1.5 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>
                      <span>AI Inzicht</span>
                    </div>
                    <p className="text-sm text-purple-800">{log.ai_validatie}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {logsToDisplay.length >= limit && (
        <div className="mt-4 text-center">
          <Link className="text-sm font-medium text-purple-600 hover:text-purple-800" href={taskId ? `/taken/${taskId}/logs` : "/taken/logs"}>
            Bekijk alle logs
          </Link>
        </div>
      )}
    </div>
  );
}
