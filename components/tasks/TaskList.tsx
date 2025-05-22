import React from 'react';

'use client';

import Link from 'next/link';

import { ErrorMessage } from '@/lib/error-handler'; // Import ErrorMessage type
import { Task } from '@/types'; // Import Task type
import { formatDate } from '@/utils/validation'; // Assuming formatDate is useful

interface TaskListProps {
  tasks: Task[] | null;
  isLoading: boolean;
  isError: boolean;
  error: ErrorMessage | null;
}

export default function TaskList({ tasks, isLoading, isError, error }: TaskListProps): JSX.Element {
  if (isLoading) {
    return <div className="text-center py-8">Laden van opdrachten...</div>;
  }

  if (isError) {
    return <div className="text-center py-8 text-red-600">Fout bij het laden van opdrachten: {error?.userMessage || 'Onbekende fout'}</div>;
  }

  if (!tasks || tasks.length === 0) {
    return <div className="text-center py-8 text-gray-600">Geen opdrachten gevonden.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tasks.map((task: Task) => (
        <div key={task.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <Link href={`/taken/${task.id}`} className="block">
            <h2 className="text-xl font-semibold text-purple-700 mb-2">{task.titel}</h2>
            <p className="text-sm text-gray-500 mb-3">Type: <span className="font-medium text-gray-700">{task.type}</span></p>
            {task.beschrijving && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.beschrijving}</p>}
            
            <div className="text-sm text-gray-700 space-y-1">
              {task.duur && <p>Duur: <span className="font-medium">{task.duur} minuten</span></p>}
              {task.hartslag_doel && <p>Hartslag doel: <span className="font-medium">{task.hartslag_doel} bpm</span></p>}
              {task.herhaal_patroon && <p>Herhaal patroon: <span className="font-medium">{task.herhaal_patroon}</span></p>}
              {task.dagen_van_week && task.dagen_van_week.length > 0 && (
                <p>Dagen: <span className="font-medium">{task.dagen_van_week.join(', ')}</span></p>
              )}
              {task.metingen && task.metingen.length > 0 && (
                <p>Metingen: <span className="font-medium">{task.metingen.join(', ')}</span></p>
              )}
              {task.labels && task.labels.length > 0 && (
                <p>Labels: <span className="font-medium">{task.labels.join(', ')}</span></p>
              )}
              {task.notities && <p>Notities: <span className="font-medium line-clamp-1">{task.notities}</span></p>}
              <p className="text-xs text-gray-400 mt-2">Aangemaakt op: {formatDate(task.created_at)}</p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
