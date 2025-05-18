'use client';
import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Task, TaskLog } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAddTaskLog, useUpdateTaskLog } from '@/hooks/useMutations';
import { ErrorMessage } from '@/lib/error-handler';
import TaskExecutionPresentational, { FeedbackState } from '@/components/tasks/TaskExecutionPresentational';
import { useNotification } from '@/context/NotificationContext';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'; // For loading task state
import { useTask } from '@/hooks/useSupabaseQuery'; // To fetch the task if not passed as prop or to refresh
import { AlertMessage } from '@/components/common/AlertMessage';


interface TaskExecutionContainerProps {
  taskId: string; // Task ID is mandatory for the container to fetch the task
  initialTask?: Task; // Optional: if task data is already available (e.g., from SSR)
  onComplete?: () => void; // Optional callback when task log is successfully submitted
}

export default function TaskExecutionContainer({ taskId, initialTask, onComplete }: TaskExecutionContainerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addNotification } = useNotification();

  // Fetch the task details
  const { 
    data: task, 
    isLoading: isLoadingTask, 
    error: fetchTaskError,
    isError: isFetchTaskError
  } = useTask(taskId, { 
    initialData: initialTask,
    enabled: !!taskId,
  });

  // Dummy task for debugging - REMOVED
  // const task: Task = initialTask || { 
  //   id: taskId, 
  //   titel: 'Laden...', 
  //   beschrijving: '', 
  //   user_id: user?.id || 'dummy-user-id', 
  //   type: 'taak', 
  //   created_at: new Date(), 
  //   updated_at: new Date(), 
  //   herhaal_patroon: 'eenmalig', 
  //   duur: 30, 
  //   notities: undefined, 
  //   labels: undefined, 
  //   hartslag_doel: undefined,
  //   dagen_van_week: undefined,
  //   metingen: undefined,
  //   specialist_id: undefined,
  // };
  // const isLoadingTask = false; // Will come from useTask
  // const fetchTaskError = null; // Will come from useTask
  //   const isFetchTaskError = false; // Will come from useTask


  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentLogId, setCurrentLogId] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  const [feedback, setFeedback] = useState<FeedbackState>({
    pijn_score: 10,
    energie_voor: 10, // Consider a pre-task step or default for this
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
  const mutationError = (addLogError || updateLogError) as ErrorMessage | null;

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hours, minutes, secs].map(v => v.toString().padStart(2, '0')).join(':');
  };

  const handleStartTask = useCallback(async () => {
    if (!user || !task) {
      addNotification({ type: 'error', message: 'Gebruiker niet geverifieerd of taak niet geladen.' });
      return;
    }
    const now = new Date();
    // Consider asking for energie_voor before starting, or set a default.
    // For now, using the value from feedback state.
    const logDataToCreateInput = {
      task_id: task.id,
      start_tijd: now.toISOString(), // API expects ISO string
      energie_voor: feedback.energie_voor,
      // user_id is added by the API route based on session
    };

    addTaskLog(logDataToCreateInput, { // Removed the problematic cast
      onSuccess: (createdLog) => {
        console.log('[TaskExecutionContainer] addTaskLog onSuccess, createdLog:', createdLog); // Log the createdLog
        if (createdLog && createdLog.id) {
          setStartTime(now);
          setCurrentLogId(createdLog.id);
          setIsRunning(true);
          setElapsedTime(0);
          addNotification({ type: 'success', message: `Taak '${task.titel}' gestart!` });
        } else {
            addNotification({ type: 'error', message: 'Kon taaklog niet aanmaken.'});
        }
      },
      onError: (error) => {
        addNotification({ type: 'error', message: (error as ErrorMessage).userMessage || 'Starten van taak mislukt.' });
      }
    });
  }, [task, user, addTaskLog, feedback.energie_voor, addNotification]);

  const handleStopTask = useCallback(() => {
    if (!isRunning || !startTime) return;
    setIsRunning(false);
    setShowFeedbackModal(true);
  }, [isRunning, startTime]);

  const handleSubmitFeedback = async () => {
    if (!startTime || !currentLogId || !user || !task) {
        addNotification({ type: 'error', message: 'Sessie ongeldig of taakdetails ontbreken.' });
        console.error('handleSubmitFeedback validation failed:', { startTime, currentLogId, userExists: !!user, taskExists: !!task });
        return;
    }
    console.log('Attempting to update task log with ID:', currentLogId); // Log the ID

    const logDataToUpdate: Partial<Omit<TaskLog, 'id' | 'created_at' | 'user_id' | 'task_id' | 'start_tijd'>> & { eind_tijd: string } = {
      eind_tijd: new Date().toISOString(), // API expects ISO string
      pijn_score: feedback.pijn_score,
      energie_na: feedback.energie_na,
      vermoeidheid_score: feedback.vermoeidheid_score,
      stemming: feedback.stemming,
      notitie: feedback.notitie,
    };

    updateTaskLog({ id: currentLogId, data: logDataToUpdate }, {
      onSuccess: () => {
        addNotification({ type: 'success', message: `Feedback voor '${task.titel}' opgeslagen.` });
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
      onError: (error) => {
         addNotification({ type: 'error', message: (error as ErrorMessage).userMessage || 'Opslaan van feedback mislukt.' });
      }
    });
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isRunning && startTime) {
      intervalId = setInterval(() => {
        setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, startTime]);

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numValue = (name === 'pijn_score' || name === 'energie_voor' || name === 'energie_na' || name === 'vermoeidheid_score') 
                     ? parseInt(value, 10) 
                     : value;
    setFeedback(prev => ({ ...prev, [name]: numValue }));
  };

  const handleCloseFeedbackModal = () => {
    setShowFeedbackModal(false);
    // Optionally, reset timer or navigate away if task is considered "abandoned"
  };

  // if (isLoadingTask && !initialTask) { // Temporarily disable loading/error states for task fetching
  //   return (
  //       <div className="bg-white rounded-lg shadow-md p-6">
  //           <SkeletonLoader type="form" count={3} />
  //       </div>
  //   );
  // }
  
  // const typedFetchTaskError = fetchTaskError as ErrorMessage | null;
  // if (isFetchTaskError && typedFetchTaskError) {
  //   return (
  //       <div className="bg-white rounded-lg shadow-md p-6">
  //           <AlertMessage type="error" title="Fout bij laden taak" message={typedFetchTaskError.userMessage || "Kon taakdetails niet laden."} />
  //       </div>
  //   );
  // }

  // if (!task) { // Task is now dummied up
  if (isLoadingTask && !initialTask) { // Restore loading/error states for task fetching
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <SkeletonLoader type="form" count={3} />
        </div>
    );
  }
  
  const typedFetchTaskError = fetchTaskError as ErrorMessage | null;
  if (isFetchTaskError && typedFetchTaskError) {
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <AlertMessage type="error" title="Fout bij laden taak" message={typedFetchTaskError.userMessage || "Kon taakdetails niet laden."} />
        </div>
    );
  }

  if (!task) { // Restore check for task
    return <div className="p-6 text-center text-gray-500">Taak niet gevonden of kon niet worden geladen.</div>;
  }

  return (
    <TaskExecutionPresentational
      task={task}
      isRunning={isRunning}
      elapsedTime={elapsedTime}
      showFeedbackModal={showFeedbackModal}
      feedback={feedback}
      isBusy={isBusy}
      mutationError={mutationError}
      onStartTask={handleStartTask}
      onStopTask={handleStopTask}
      onSubmitFeedback={handleSubmitFeedback}
      onFeedbackChange={handleFeedbackChange}
      onCloseFeedbackModal={handleCloseFeedbackModal}
      formatTime={formatTime}
    />
  );
}
