import React from 'react';

'use client';

import { Task as TaskType, TaskLog } from '@/types';
import { CalendarDays, Zap, Edit3, Trash2, Eye } from 'lucide-react'; // Zap voor Opdracht, CalendarDays voor Taak
import Link from 'next/link';

// Velden uit TaskLog die we per taak willen tonen
type TaskFeedback = Partial<Pick<TaskLog, 'pijn_score' | 'vermoeidheid_score' | 'energie_voor' | 'energie_na' | 'stemming' | 'notitie' | 'hartslag'>>; // hartslag toegevoegd

export interface TaskWithStatusAndFeedbackForCard extends TaskType {
  status?: 'voltooid' | 'openstaand'; 
  feedback?: TaskFeedback;
  voltooid_op?: string | Date | null; // Datum/tijd van voltooiing
}

interface TaskItemCardProps {
  task: TaskWithStatusAndFeedbackForCard;
  showActions?: boolean; // Om actieknoppen te tonen/verbergen (bijv. niet op patiënt dashboard)
  onViewLog?: (taskId: string) => void; // Actie voor bekijken log/starten
  onEdit?: (task: TaskType) => void;
  onDelete?: (taskId: string) => void;
}

const TaskItemCard: React.FC<TaskItemCardProps> = ({ 
  task, 
  showActions = false, 
  onViewLog, 
  onEdit, 
  onDelete 
}) => {
  const Icon = task.type === 'opdracht' ? Zap : CalendarDays;
  const cardBgColor = task.status === 'voltooid' ? 'bg-green-50 hover:bg-green-100' : 
                      task.status === 'openstaand' ? 'bg-orange-50 hover:bg-orange-100' : 
                      'bg-gray-50 hover:bg-gray-100';

  return (
    <li className={`p-4 rounded-lg shadow border ${cardBgColor} transition-colors duration-150`}>
      <div className="flex items-start justify-between">
        <div className="flex-grow">
          <div className="flex items-center mb-1">
            <Icon size={18} className="mr-2 text-purple-600" />
            <h3 className="text-md font-semibold text-gray-800">{task.titel}</h3>
          </div>
          {task.beschrijving && <p className="text-sm text-gray-600 mb-2">{task.beschrijving.length > 100 ? task.beschrijving.substring(0, 97) + '...' : task.beschrijving}</p>}
          
          <div className="flex flex-wrap gap-2 text-xs mb-2">
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{task.type}</span>
            <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">{task.herhaal_patroon}</span>
            {task.duur && <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">{task.duur} min</span>}
          </div>
          
          {task.status && (
             <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                task.status === 'voltooid' ? 'bg-green-200 text-green-800' : 'bg-orange-200 text-orange-800'
              }`}>
                {task.status}
              </span>
          )}
        </div>
        {showActions && (onViewLog || onEdit || onDelete) && (
          <div className="flex-shrink-0 ml-4 space-x-2">
            {onViewLog && (
              <button 
                onClick={() => onViewLog(task.id)} 
                title="Bekijk/Start Taak"
                className="p-1.5 text-gray-500 hover:text-purple-600 rounded-full hover:bg-purple-100"
              >
                <Eye size={18} />
              </button>
            )}
            {onEdit && (
              <button 
                onClick={() => onEdit(task)} 
                title="Bewerk Taak"
                className="p-1.5 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-100"
              >
                <Edit3 size={18} />
              </button>
            )}
            {onDelete && (
              <button 
                onClick={() => onDelete(task.id)} 
                title="Verwijder Taak"
                className="p-1.5 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        )}
      </div>

      {task.feedback && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-700 space-y-0.5">
          <h4 className="font-medium text-gray-500 mb-1">Feedback:</h4>
          {task.feedback.pijn_score !== undefined && <p>Pijn: {task.feedback.pijn_score}/20</p>}
          {task.feedback.vermoeidheid_score !== undefined && <p>Vermoeidheid: {task.feedback.vermoeidheid_score}/20</p>}
          {task.feedback.energie_voor !== undefined && task.feedback.energie_na !== undefined && 
            <p>Energie: {task.feedback.energie_voor}/20 &rarr; {task.feedback.energie_na}/20</p>}
          {task.feedback.hartslag !== undefined && <p>Hartslag: {task.feedback.hartslag} bpm</p>}
          {task.feedback.stemming && <p>Stemming: {task.feedback.stemming}</p>}
          {task.feedback.notitie && <p className="italic">Notitie: "{task.feedback.notitie}"</p>}
        </div>
      )}
      <div className="text-xs text-gray-400 mt-2">
        <p>Aangemaakt op: {new Date(task.created_at).toLocaleDateString('nl-BE')}</p>
        {task.status === 'voltooid' && task.voltooid_op && (
          <p>Voltooid op: {new Date(task.voltooid_op).toLocaleString('nl-BE', { dateStyle: 'short', timeStyle: 'short' })}</p>
        )}
      </div>
    </li>
  );
};

export default TaskItemCard;
