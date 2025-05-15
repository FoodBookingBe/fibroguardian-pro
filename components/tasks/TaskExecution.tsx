'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Task } from '@/types';

interface TaskExecutionProps {
  task: Task;
  onComplete?: () => void;
}

export default function TaskExecution({ task, onComplete }: TaskExecutionProps) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // Feedback state
  const [feedback, setFeedback] = useState({
    pijn_score: 10,
    energie_voor: 10,
    energie_na: 10,
    vermoeidheid_score: 10,
    stemming: 'neutraal',
    notitie: '',
  });

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hours, minutes, secs]
      .map(v => v.toString().padStart(2, '0'))
      .join(':');
  };

  // Start the task timer
  const startTask = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const now = new Date();
      const supabaseClient = getSupabaseBrowserClient();
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (!user) throw new Error('Niet ingelogd');
      
      // Create a new task log with start time
      const { data, error: logError } = await supabaseClient
        .from('task_logs')
        .insert([{
          task_id: task.id,
          user_id: user.id,
          start_tijd: now.toISOString(),
          energie_voor: feedback.energie_voor,
        }])
        .select()
        .single();
      
      if (logError) throw logError;
      
      // Start the timer
      setStartTime(now);
      setIsRunning(true);
      setElapsedTime(0);
    } catch (error: any) {
      console.error('Fout bij starten taak:', error);
      setError(error.message || 'Er is een fout opgetreden bij het starten van de taak');
    } finally {
      setLoading(false);
    }
  }, [task.id, feedback.energie_voor]);

  // Stop the task timer and show feedback modal
  const stopTask = useCallback(async () => {
    if (!isRunning || !startTime) return;
    
    setIsRunning(false);
    setShowFeedbackModal(true);
  }, [isRunning, startTime]);

  // Submit feedback and complete the task
  const submitFeedback = async () => {
    if (!startTime) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const supabaseClient = getSupabaseBrowserClient();
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (!user) throw new Error('Niet ingelogd');
      
      // Find the task log that was created when starting the task
      const { data: existingLogs, error: fetchError } = await supabaseClient
        .from('task_logs')
        .select('id')
        .eq('task_id', task.id)
        .eq('user_id', user.id)
        .eq('start_tijd', startTime.toISOString())
        .is('eind_tijd', null)
        .order('start_tijd', { ascending: false })
        .limit(1);
      
      if (fetchError) throw fetchError;
      
      if (!existingLogs || existingLogs.length === 0) {
        throw new Error('Geen actieve taaklog gevonden');
      }
      
      const logId = existingLogs[0].id;
      const now = new Date();
      
      // Update the task log with end time and feedback
      const { error: updateError } = await supabaseClient
        .from('task_logs')
        .update({
          eind_tijd: now.toISOString(),
          pijn_score: feedback.pijn_score,
          energie_na: feedback.energie_na,
          vermoeidheid_score: feedback.vermoeidheid_score,
          stemming: feedback.stemming,
          notitie: feedback.notitie,
        })
        .eq('id', logId);
      
      if (updateError) throw updateError;
      
      // Close the feedback modal and reset state
      setShowFeedbackModal(false);
      setStartTime(null);
      setElapsedTime(0);
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      } else {
        // Navigate back to tasks list
        router.push('/taken');
      }
    } catch (error: any) {
      console.error('Fout bij opslaan feedback:', error);
      setError(error.message || 'Er is een fout opgetreden bij het opslaan van de feedback');
    } finally {
      setLoading(false);
    }
  };

  // Update timer every second
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startTime]);

  // Handle feedback changes
  const handleFeedbackChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFeedback(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">{task.titel}</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mb-6">
        <div className="text-4xl font-mono text-center py-6 bg-gray-100 rounded-lg">
          {formatTime(elapsedTime)}
        </div>
      </div>
      
      <div className="flex justify-center space-x-4">
        {!isRunning ? (
          <button
            onClick={startTask}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-300"
          >
            {loading ? 'Bezig...' : 'Start Taak'}
          </button>
        ) : (
          <button
            onClick={stopTask}
            disabled={loading}
            className="px-6 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-red-300"
          >
            {loading ? 'Bezig...' : 'Stop Taak'}
          </button>
        )}
      </div>
      
      {task.beschrijving && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Beschrijving / Instructies:</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{task.beschrijving}</p>
        </div>
      )}
      
      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Hoe voelde deze taak?</h3>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                {/* Pijn score */}
                <div>
                  <label htmlFor="pijn_score" className="block text-sm font-medium text-gray-700 mb-1">
                    Pijnniveau (1-20): {feedback.pijn_score}
                  </label>
                  <input
                    type="range"
                    id="pijn_score"
                    name="pijn_score"
                    min="1"
                    max="20"
                    value={feedback.pijn_score}
                    onChange={handleFeedbackChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Geen pijn</span>
                    <span>Extreme pijn</span>
                  </div>
                </div>
                
                {/* Energie na */}
                <div>
                  <label htmlFor="energie_na" className="block text-sm font-medium text-gray-700 mb-1">
                    Energieniveau na (1-20): {feedback.energie_na}
                  </label>
                  <input
                    type="range"
                    id="energie_na"
                    name="energie_na"
                    min="1"
                    max="20"
                    value={feedback.energie_na}
                    onChange={handleFeedbackChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Geen energie</span>
                    <span>Vol energie</span>
                  </div>
                </div>
                
                {/* Vermoeidheid score */}
                <div>
                  <label htmlFor="vermoeidheid_score" className="block text-sm font-medium text-gray-700 mb-1">
                    Vermoeidheidsniveau (1-20): {feedback.vermoeidheid_score}
                  </label>
                  <input
                    type="range"
                    id="vermoeidheid_score"
                    name="vermoeidheid_score"
                    min="1"
                    max="20"
                    value={feedback.vermoeidheid_score}
                    onChange={handleFeedbackChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Niet vermoeid</span>
                    <span>Extreem vermoeid</span>
                  </div>
                </div>
                
                {/* Stemming */}
                <div>
                  <label htmlFor="stemming" className="block text-sm font-medium text-gray-700 mb-1">
                    Algemeen gevoel
                  </label>
                  <select
                    id="stemming"
                    name="stemming"
                    value={feedback.stemming}
                    onChange={handleFeedbackChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="zeer goed">Zeer goed</option>
                    <option value="goed">Goed</option>
                    <option value="redelijk">Redelijk</option>
                    <option value="neutraal">Neutraal</option>
                    <option value="matig">Matig</option>
                    <option value="slecht">Slecht</option>
                    <option value="zeer slecht">Zeer slecht</option>
                  </select>
                </div>
                
                {/* Notitie */}
                <div>
                  <label htmlFor="notitie" className="block text-sm font-medium text-gray-700 mb-1">
                    Opmerkingen (optioneel)
                  </label>
                  <textarea
                    id="notitie"
                    name="notitie"
                    value={feedback.notitie}
                    onChange={handleFeedbackChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Eventuele opmerkingen over deze taak..."
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Annuleren
                </button>
                <button
                  type="button"
                  onClick={submitFeedback}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-purple-300"
                >
                  {loading ? 'Bezig met opslaan...' : 'Opslaan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
