'use client';
import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Task, TaskLog } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAddTaskLog, useUpdateTaskLog } from '@/hooks/useMutations';
import { AlertMessage } from '@/components/common/AlertMessage'; // Use named import
import { ErrorMessage } from '@/lib/error-handler'; // For typing errors from hooks

interface TaskExecutionProps {
  task: Task;
  onComplete?: () => void;
}

export default function TaskExecution({ task, onComplete }: TaskExecutionProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentLogId, setCurrentLogId] = useState<string | null>(null); // To store ID of the created log
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  const [feedback, setFeedback] = useState({
    pijn_score: 10,
    energie_voor: 10, // This should ideally be captured *before* starting
    energie_na: 10,
    vermoeidheid_score: 10,
    stemming: 'neutraal',
    notitie: '',
  });

  const { 
    mutate: addTaskLog, 
    isPending: isAddingLog, 
    error: addLogError 
  } = useAddTaskLog();
  const { 
    mutate: updateTaskLog, 
    isPending: isUpdatingLog, 
    error: updateLogError 
  } = useUpdateTaskLog();

  const isBusy = isAddingLog || isUpdatingLog;
  const mutationError = addLogError || updateLogError;

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hours, minutes, secs].map(v => v.toString().padStart(2, '0')).join(':');
  };

  const handleStartTask = useCallback(async () => {
    if (!user) {
      console.error("User not authenticated");
      // Consider setting a local error state to display via AlertMessage
      return;
    }
    const now = new Date();
    const logDataToCreate = {
      task_id: task.id,
      start_tijd: now.toISOString(),
      // energie_voor should be captured before this point, or set to a default/null
      energie_voor: feedback.energie_voor, 
    };

    addTaskLog(logDataToCreate as any, { // Cast as any if type for Omit is too complex for this step
      onSuccess: (createdLog) => {
        if (createdLog) {
          setStartTime(now);
          setCurrentLogId(createdLog.id);
          setIsRunning(true);
          setElapsedTime(0);
        }
      },
      // onError is handled by mutationError state
    });
  }, [task.id, user, addTaskLog, feedback.energie_voor]);

  const handleStopTask = useCallback(() => {
    if (!isRunning || !startTime) return;
    setIsRunning(false);
    setShowFeedbackModal(true);
  }, [isRunning, startTime]);

  const handleSubmitFeedback = async () => {
    if (!startTime || !currentLogId || !user) return;

    const logDataToUpdate: Partial<TaskLog> = { // Explicitly type for clarity
      eind_tijd: new Date(), // Pass as Date object
      pijn_score: feedback.pijn_score,
      energie_na: feedback.energie_na,
      vermoeidheid_score: feedback.vermoeidheid_score,
      stemming: feedback.stemming,
      notitie: feedback.notitie,
      // user_id and task_id are already set, not needed in update payload for this API
    };

    updateTaskLog({ id: currentLogId, data: logDataToUpdate }, {
      onSuccess: () => {
        setShowFeedbackModal(false);
        setStartTime(null);
        setCurrentLogId(null);
        setElapsedTime(0);
        if (onComplete) {
          onComplete();
        } else {
          router.push('/taken');
        }
      },
      // onError is handled by mutationError state
    });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startTime]);

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numValue = (name === 'pijn_score' || name === 'energie_voor' || name === 'energie_na' || name === 'vermoeidheid_score') 
                     ? parseInt(value, 10) 
                     : value;
    setFeedback(prev => ({ ...prev, [name]: numValue }));
  };
  
  const typedMutationError = mutationError as ErrorMessage | null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">{task.titel}</h2>
      
      {typedMutationError && (
        <AlertMessage type="error" message={typedMutationError.userMessage || 'Er is een fout opgetreden.'} />
      )}
      
      <div className="mb-6">
        <div className="text-4xl font-mono text-center py-6 bg-gray-100 rounded-lg">
          {formatTime(elapsedTime)}
        </div>
      </div>
      
      <div className="flex justify-center space-x-4">
        {!isRunning && !currentLogId ? ( // Show start only if not running AND no log has been created yet
          <button
            onClick={handleStartTask}
            disabled={isBusy}
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-300"
          >
            {isAddingLog ? 'Bezig...' : 'Start Taak'}
          </button>
        ) : (
          <button
            onClick={handleStopTask}
            disabled={isBusy || !isRunning} // Disable if busy or not running
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
              
              {typedMutationError && ( // Show error from update attempt inside modal
                <AlertMessage type="error" message={typedMutationError.userMessage || 'Fout bij opslaan feedback.'} className="text-sm" />
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="pijn_score" className="block text-sm font-medium text-gray-700 mb-1">
                    Pijnniveau (1-20): {feedback.pijn_score}
                  </label>
                  <input type="range" id="pijn_score" name="pijn_score" min="1" max="20" value={feedback.pijn_score} onChange={handleFeedbackChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1"><span>Geen pijn</span><span>Extreme pijn</span></div>
                </div>
                <div>
                  <label htmlFor="energie_na" className="block text-sm font-medium text-gray-700 mb-1">
                    Energieniveau na (1-20): {feedback.energie_na}
                  </label>
                  <input type="range" id="energie_na" name="energie_na" min="1" max="20" value={feedback.energie_na} onChange={handleFeedbackChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1"><span>Geen energie</span><span>Vol energie</span></div>
                </div>
                <div>
                  <label htmlFor="vermoeidheid_score" className="block text-sm font-medium text-gray-700 mb-1">
                    Vermoeidheidsniveau (1-20): {feedback.vermoeidheid_score}
                  </label>
                  <input type="range" id="vermoeidheid_score" name="vermoeidheid_score" min="1" max="20" value={feedback.vermoeidheid_score} onChange={handleFeedbackChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1"><span>Niet vermoeid</span><span>Extreem vermoeid</span></div>
                </div>
                <div>
                  <label htmlFor="stemming" className="block text-sm font-medium text-gray-700 mb-1">Algemeen gevoel</label>
                  <select id="stemming" name="stemming" value={feedback.stemming} onChange={handleFeedbackChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="zeer goed">Zeer goed</option><option value="goed">Goed</option><option value="redelijk">Redelijk</option><option value="neutraal">Neutraal</option><option value="matig">Matig</option><option value="slecht">Slecht</option><option value="zeer slecht">Zeer slecht</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="notitie" className="block text-sm font-medium text-gray-700 mb-1">Opmerkingen (optioneel)</label>
                  <textarea id="notitie" name="notitie" value={feedback.notitie} onChange={handleFeedbackChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Eventuele opmerkingen over deze taak..."></textarea>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowFeedbackModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors" disabled={isUpdatingLog}>Annuleren</button>
                <button type="button" onClick={handleSubmitFeedback} disabled={isUpdatingLog} className={`px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-purple-300`}>
                  {isUpdatingLog ? 'Bezig met opslaan...' : 'Opslaan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
