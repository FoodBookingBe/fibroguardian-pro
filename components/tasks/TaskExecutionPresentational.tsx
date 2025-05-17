'use client';
import React from 'react';
import { Task } from '@/types';
import { AlertMessage } from '@/components/common/AlertMessage';
import { ErrorMessage } from '@/lib/error-handler';

export interface FeedbackState {
  pijn_score: number;
  energie_voor: number;
  energie_na: number;
  vermoeidheid_score: number;
  stemming: string;
  notitie: string;
}

interface TaskExecutionPresentationalProps {
  task: Task;
  isRunning: boolean;
  elapsedTime: number;
  showFeedbackModal: boolean;
  feedback: FeedbackState;
  isBusy: boolean; // Combined loading state for add/update log
  mutationError: ErrorMessage | null;

  onStartTask: () => void;
  onStopTask: () => void;
  onSubmitFeedback: () => void;
  onFeedbackChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onCloseFeedbackModal: () => void;
  formatTime: (seconds: number) => string;
}

export default function TaskExecutionPresentational({
  task,
  isRunning,
  elapsedTime,
  showFeedbackModal,
  feedback,
  isBusy,
  mutationError,
  onStartTask,
  onStopTask,
  onSubmitFeedback,
  onFeedbackChange,
  onCloseFeedbackModal,
  formatTime,
}: TaskExecutionPresentationalProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">{task.titel}</h2>
      
      {mutationError && (
        <AlertMessage type="error" message={mutationError.userMessage || 'Er is een fout opgetreden.'} />
      )}
      
      <div className="mb-6">
        <div className="text-4xl font-mono text-center py-6 bg-gray-100 rounded-lg">
          {formatTime(elapsedTime)}
        </div>
      </div>
      
      <div className="flex justify-center space-x-4">
        {!isRunning && elapsedTime === 0 ? ( // Show start only if not running AND timer is at 0 (implies not started yet or reset)
          <button
            onClick={onStartTask}
            disabled={isBusy}
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-300"
          >
            {isBusy ? 'Bezig...' : 'Start Taak'}
          </button>
        ) : (
          <button
            onClick={onStopTask}
            disabled={isBusy || !isRunning}
            className="px-6 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-red-300"
          >
            Stop Taak
          </button>
        )}
      </div>
      
      {task.beschrijving && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Beschrijving / Instructies:</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{task.beschrijving}</p>
        </div>
      )}
      
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Hoe voelde deze taak?</h3>
              
              {mutationError && ( // Show error from update attempt inside modal
                <AlertMessage type="error" message={mutationError.userMessage || 'Fout bij opslaan feedback.'} className="text-sm mb-3" />
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="pijn_score" className="block text-sm font-medium text-gray-700 mb-1">
                    Pijnniveau (1-20): {feedback.pijn_score}
                  </label>
                  <input type="range" id="pijn_score" name="pijn_score" min="1" max="20" value={feedback.pijn_score} onChange={onFeedbackChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1"><span>Geen pijn</span><span>Extreme pijn</span></div>
                </div>
                <div>
                  <label htmlFor="energie_na" className="block text-sm font-medium text-gray-700 mb-1">
                    Energieniveau na (1-20): {feedback.energie_na}
                  </label>
                  <input type="range" id="energie_na" name="energie_na" min="1" max="20" value={feedback.energie_na} onChange={onFeedbackChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1"><span>Geen energie</span><span>Vol energie</span></div>
                </div>
                <div>
                  <label htmlFor="vermoeidheid_score" className="block text-sm font-medium text-gray-700 mb-1">
                    Vermoeidheidsniveau (1-20): {feedback.vermoeidheid_score}
                  </label>
                  <input type="range" id="vermoeidheid_score" name="vermoeidheid_score" min="1" max="20" value={feedback.vermoeidheid_score} onChange={onFeedbackChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1"><span>Niet vermoeid</span><span>Extreem vermoeid</span></div>
                </div>
                <div>
                  <label htmlFor="stemming" className="block text-sm font-medium text-gray-700 mb-1">Algemeen gevoel</label>
                  <select id="stemming" name="stemming" value={feedback.stemming} onChange={onFeedbackChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="zeer goed">Zeer goed</option><option value="goed">Goed</option><option value="redelijk">Redelijk</option><option value="neutraal">Neutraal</option><option value="matig">Matig</option><option value="slecht">Slecht</option><option value="zeer slecht">Zeer slecht</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="notitie" className="block text-sm font-medium text-gray-700 mb-1">Opmerkingen (optioneel)</label>
                  <textarea id="notitie" name="notitie" value={feedback.notitie} onChange={onFeedbackChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Eventuele opmerkingen over deze taak..."></textarea>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={onCloseFeedbackModal} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors" disabled={isBusy}>Annuleren</button>
                <button type="button" onClick={onSubmitFeedback} disabled={isBusy} className={`px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-purple-300`}>
                  {isBusy ? 'Bezig met opslaan...' : 'Opslaan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}