'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTasks, useRecentLogs, useReflecties, useInsights, useProfile } from '@/hooks/useSupabaseQuery'; // Changed useReflections to useReflecties
import { useDeleteSpecialistPatientRelation } from '@/hooks/useMutations'; // Changed useRemoveSpecialistPatientRelation
import PatientDetailsPresentational from '@/components/specialisten/PatientDetailsPresentational';
import { Profile, TaskLog, Reflectie, Inzicht, Task } from '@/types';
import { ErrorMessage } from '@/lib/error-handler';
import { useNotification } from '@/context/NotificationContext';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { AlertMessage } from '@/components/common/AlertMessage';

interface PatientDetailsContainerProps {
  patientId: string;
  // Initial patient profile can be passed if fetched server-side by the page
  // Otherwise, the container will fetch it.
  initialPatientProfile?: Profile; 
}

type ActiveTabData = 'overview' | 'tasks' | 'logs' | 'reflecties' | 'inzichten';

export default function PatientDetailsContainer({ patientId, initialPatientProfile }: PatientDetailsContainerProps) {
  const router = useRouter();
  const { user: specialistUser } = useAuth(); // This is the logged-in specialist
  const { addNotification } = useNotification();

  const [activeTab, setActiveTab] = useState<ActiveTabData>('overview');
  const [confirmRemove, setConfirmRemove] = useState(false);

  // Fetch patient profile if not provided, or to ensure it's up-to-date
  const { 
    data: patientProfile, 
    isLoading: isLoadingPatientProfile, 
    error: patientProfileError,
    isError: isPatientProfileError
  } = useProfile(patientId, { 
    initialData: initialPatientProfile,
    enabled: !!patientId, // Fetch only if patientId is available
  });

  // Data fetching hooks for each tab, enabled based on activeTab
  const { data: tasks, isLoading: isLoadingTasks, error: tasksError, isError: isTasksError } = useTasks(patientId, {}, { enabled: activeTab === 'tasks' && !!patientId });
  const { data: logs, isLoading: isLoadingLogs, error: logsError, isError: isLogsError } = useRecentLogs(patientId, 50, { enabled: (activeTab === 'logs' || activeTab === 'overview') && !!patientId }); // Overview also uses logs for chart
  const { data: reflecties, isLoading: isLoadingReflections, error: reflectionsError, isError: isReflectionsError } = useReflecties(patientId, { limit: 30, order: { column: 'datum', ascending: false } }, { enabled: activeTab === 'reflecties' && !!patientId }); // Changed useReflections
  const { data: inzichten, isLoading: isLoadingInsights, error: insightsError, isError: isInsightsError } = useInsights(patientId, 10, { enabled: activeTab === 'inzichten' && !!patientId });

  const { mutate: removeRelation, isPending: isRemovingPatient } = useDeleteSpecialistPatientRelation(); // Changed useRemoveSpecialistPatientRelation

  const isLoadingTabData = useMemo(() => {
    if (activeTab === 'tasks') return isLoadingTasks;
    if (activeTab === 'logs' || activeTab === 'overview') return isLoadingLogs; // Overview uses logs
    if (activeTab === 'reflecties') return isLoadingReflections;
    if (activeTab === 'inzichten') return isLoadingInsights;
    return false;
  }, [activeTab, isLoadingTasks, isLoadingLogs, isLoadingReflections, isLoadingInsights]);

  const tabDataError = useMemo(() => {
    if (activeTab === 'tasks' && isTasksError) return tasksError as ErrorMessage | null;
    if ((activeTab === 'logs' || activeTab === 'overview') && isLogsError) return logsError as ErrorMessage | null;
    if (activeTab === 'reflecties' && isReflectionsError) return reflectionsError as ErrorMessage | null;
    if (activeTab === 'inzichten' && isInsightsError) return insightsError as ErrorMessage | null;
    return null;
  }, [activeTab, isTasksError, tasksError, isLogsError, logsError, isReflectionsError, reflectionsError, isInsightsError, insightsError]);


  const formatDate = (dateString?: Date | string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  
  const handleConfirmRemoveToggle = () => {
    setConfirmRemove(prev => !prev);
    if (confirmRemove) { // If it was true and now toggling off
        // Optionally reset a timer if one was set to auto-cancel
    } else {
        // Set a timer to auto-cancel confirmation after a few seconds
        setTimeout(() => setConfirmRemove(false), 5000);
    }
  };

  const handleRemovePatient = () => {
    if (!specialistUser || !patientProfile) return;

    removeRelation({ specialist_id: specialistUser.id, patient_id: patientProfile.id }, {
      onSuccess: () => {
        addNotification({ type: 'success', message: `${patientProfile.voornaam} is losgekoppeld.` });
        router.push('/specialisten/patienten');
        router.refresh(); // Or use queryClient.invalidateQueries
      },
      onError: (error: ErrorMessage) => { // Explicitly type error
        addNotification({ type: 'error', message: error.userMessage || 'Kon patiënt niet loskoppelen.' });
        setConfirmRemove(false); // Reset confirmation on error
      }
    });
  };
  
  const calculateAge = (birthdate?: string | Date) => {
    if (!birthdate) return null;
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };
  
  const patientAge = useMemo(() => calculateAge(patientProfile?.geboortedatum), [patientProfile?.geboortedatum]);
  
  const metricAverages = useMemo(() => {
    if (!logs || logs.length === 0) return { pijn: null, vermoeidheid: null, energie: null };
    const pijnScores = logs.map(log => log.pijn_score).filter(s => s != null) as number[];
    const vermoeidheidScores = logs.map(log => log.vermoeidheid_score).filter(s => s != null) as number[];
    const energieNaScores = logs.map(log => log.energie_na).filter(s => s != null) as number[];
    const average = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null;
    return { pijn: average(pijnScores), vermoeidheid: average(vermoeidheidScores), energie: average(energieNaScores) };
  }, [logs]);

  if (isLoadingPatientProfile && !initialPatientProfile) {
    return (
        <div className="p-6">
            <SkeletonLoader type="profile" /> 
            <div className="mt-6"><SkeletonLoader type="tasks" count={3} /></div>
        </div>
    );
  }

  const typedPatientProfileError = patientProfileError as ErrorMessage | null;
  if (isPatientProfileError && typedPatientProfileError) {
    return (
        <div className="p-6">
            <AlertMessage type="error" title="Fout bij laden patiëntprofiel" message={typedPatientProfileError.userMessage || "Kon patiëntprofiel niet laden."} />
        </div>
    );
  }

  if (!patientProfile) {
    return <div className="p-6 text-center text-gray-500">Patiënt niet gevonden of kon niet worden geladen.</div>;
  }
  
  return (
    <PatientDetailsPresentational
      patient={patientProfile}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      logs={logs || []}
      reflecties={reflecties || []}
      inzichten={inzichten || []}
      tasks={tasks || []}
      isLoadingTabData={isLoadingTabData}
      tabDataError={tabDataError}
      patientAge={patientAge}
      metricAverages={metricAverages}
      isRemovingPatient={isRemovingPatient}
      onRemovePatient={handleRemovePatient}
      confirmRemove={confirmRemove}
      onConfirmRemoveToggle={handleConfirmRemoveToggle}
      formatDate={formatDate}
    />
  );
}