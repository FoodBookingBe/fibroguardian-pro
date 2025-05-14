'use client';
import { Task } from '@/types';
import Link from 'next/link'; // For edit/view links

interface TaskListProps {
  tasks: Task[];
}

export default function TaskList({ tasks }: TaskListProps) {
  // Placeholder for TaskList component
  // Implement display of tasks, potentially with options to edit/delete

  if (tasks.length === 0) {
    return <p className="text-gray-500">Geen taken gevonden. Voeg een nieuwe taak toe!</p>;
  }

  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <div key={task.id} className="card">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-purple-700">{task.titel}</h3>
              <p className="text-sm text-gray-600 capitalize">Type: {task.type}</p>
              {task.beschrijving && <p className="mt-1 text-sm text-gray-500">{task.beschrijving}</p>}
            </div>
            <div className="flex space-x-2">
              <Link href={`/taken/${task.id}/bewerk`} className="text-sm text-blue-500 hover:underline"> {/* Assuming edit route */}
                Bewerk
              </Link>
              {/* Add delete button/functionality here */}
            </div>
          </div>
          {/* Display more task details if needed, e.g., duration, repeat pattern */}
          {task.duur && <p className="mt-2 text-xs text-gray-500">Duur: {task.duur} minuten</p>}
          {task.herhaal_patroon && <p className="text-xs text-gray-500 capitalize">Herhaling: {task.herhaal_patroon}</p>}
        </div>
      ))}
    </div>
  );
}