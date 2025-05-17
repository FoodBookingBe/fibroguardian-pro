'use client';
import React from 'react';
import Link from 'next/link';
import { Profile, TaskLog, Reflectie, Inzicht, Task } from '@/types';
import HealthMetricsChart from '@/components/dashboard/HealthMetricsChart';
import { AlertMessage } from '@/components/common/AlertMessage'; // For displaying errors passed from container
import { ErrorMessage } from '@/lib/error-handler'; // For typing errors

interface PatientDetailsPresentationalProps {
  patient: Profile;
  activeTab: 'overview' | 'tasks' | 'logs' | 'reflecties' | 'inzichten';
  onTabChange: (tab: 'overview' | 'tasks' | 'logs' | 'reflecties' | 'inzichten') => void;
  
  logs: TaskLog[];
  reflecties: Reflectie[];
  inzichten: Inzicht[];
  tasks: Task[];
  
  isLoadingTabData: boolean; // Generic loading for tab content
  tabDataError: ErrorMessage | null; // Generic error for tab content
  
  patientAge: number | null;
  metricAverages: { pijn: number | null; vermoeidheid: number | null; energie: number | null };
  
  isRemovingPatient: boolean;
  onRemovePatient: () => void;
  confirmRemove: boolean;
  onConfirmRemoveToggle: () => void; // Toggles confirmRemove state
  
  formatDate: (dateString?: Date | string) => string;
}

const tabOptionsConfig = (tasksCount: number, logsCount: number, reflectiesCount: number, inzichtenCount: number) => [
  { id: 'overview', label: 'Overzicht' },
  { id: 'tasks', label: `Taken (${tasksCount})` },
  { id: 'logs', label: `Activiteiten (${logsCount})` },
  { id: 'reflecties', label: `Reflecties (${reflectiesCount})` },
  { id: 'inzichten', label: `Inzichten (${inzichtenCount})` },
] as const;


export default function PatientDetailsPresentational({
  patient,
  activeTab,
  onTabChange,
  logs,
  reflecties,
  inzichten,
  tasks,
  isLoadingTabData,
  tabDataError,
  patientAge,
  metricAverages,
  isRemovingPatient,
  onRemovePatient,
  confirmRemove,
  onConfirmRemoveToggle,
  formatDate,
}: PatientDetailsPresentationalProps) {

  const tabOptions = tabOptionsConfig(tasks.length, logs.length, reflecties.length, inzichten.length);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 text-2xl font-semibold">
              {patient.avatar_url ? (
                <img src={patient.avatar_url} alt={`${patient.voornaam} ${patient.achternaam}`} className="h-16 w-16 rounded-full object-cover"/>
              ) : (
                <span>{patient.voornaam?.charAt(0)}{patient.achternaam?.charAt(0)}</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patient.voornaam} {patient.achternaam}</h1>
              <p className="text-sm text-gray-600">
                {patient.postcode} {patient.gemeente}
                {patientAge !== null && ` • ${patientAge} jaar`}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 items-stretch">
            <Link href={`/specialisten/patient/${patient.id}/taken/nieuw`} className="btn-primary text-center whitespace-nowrap">Taak Toewijzen</Link>
            <button
              onClick={confirmRemove ? onRemovePatient : onConfirmRemoveToggle}
              disabled={isRemovingPatient}
              className={`btn-secondary whitespace-nowrap ${confirmRemove ? 'bg-red-500 hover:bg-red-600 text-white' : ''}`}
            >
              {isRemovingPatient ? 'Bezig...' : confirmRemove ? 'Bevestig Verwijderen' : 'Koppel Los'}
            </button>
          </div>
        </div>
        {/* Display general errors from container if needed, e.g., patient removal error */}
      </div>
      
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {tabOptions.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`py-3 px-4 font-medium text-sm border-b-2 whitespace-nowrap ${
                  activeTab === tab.id ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } focus:outline-none focus:ring-1 focus:ring-purple-400`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6 min-h-[300px]">
          {isLoadingTabData && <div className="text-center py-10">Laden...</div>}
          {!isLoadingTabData && tabDataError && (
            <AlertMessage type="error" title="Fout bij laden data" message={tabDataError.userMessage || "Kon data voor dit tabblad niet laden."} />
          )}

          {!isLoadingTabData && !tabDataError && activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Patiënt Overzicht</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center"><div className="text-xs text-gray-500 mb-1">Gem. Pijn</div><div className="text-xl font-bold text-gray-800">{metricAverages.pijn !== null ? `${metricAverages.pijn}/20` : '-'}</div></div>
                <div className="bg-gray-50 rounded-lg p-4 text-center"><div className="text-xs text-gray-500 mb-1">Gem. Vermoeidheid</div><div className="text-xl font-bold text-gray-800">{metricAverages.vermoeidheid !== null ? `${metricAverages.vermoeidheid}/20` : '-'}</div></div>
                <div className="bg-gray-50 rounded-lg p-4 text-center"><div className="text-xs text-gray-500 mb-1">Gem. Energie (na)</div><div className="text-xl font-bold text-gray-800">{metricAverages.energie !== null ? `${metricAverages.energie}/20` : '-'}</div></div>
              </div>
              {/* HealthMetricsChart expects logs. Ensure logs for overview are available or fetched by container */}
              <div className="h-72 mt-4"><HealthMetricsChart logs={logs} /></div>
            </div>
          )}
          {!isLoadingTabData && !tabDataError && activeTab === 'tasks' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Toegewezen Taken</h2>
              {tasks.length === 0 ? <p className="text-gray-500">Nog geen taken toegewezen aan deze patiënt.</p> : (
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div key={task.id} className="p-3 border rounded-md bg-gray-50">
                      <h3 className="font-medium text-gray-800">{task.titel}</h3>
                      <p className="text-xs text-gray-500 capitalize">{task.type} - {task.herhaal_patroon}</p>
                      {task.beschrijving && <p className="text-sm text-gray-600 mt-1">{task.beschrijving}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {!isLoadingTabData && !tabDataError && activeTab === 'logs' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Activiteiten Logs</h2>
              {logs.length === 0 ? <p className="text-gray-500">Geen activiteitenlogs gevonden voor deze patiënt.</p> : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {logs.map(log => (
                    <div key={log.id} className="p-3 border rounded-md bg-gray-50">
                      <h3 className="font-medium text-gray-800">{(log as any).tasks?.titel || 'Activiteit'} - {formatDate(log.start_tijd)}</h3>
                      <p className="text-xs text-gray-500">Pijn: {log.pijn_score ?? '-'}, Vermoeidheid: {log.vermoeidheid_score ?? '-'}, Energie: {log.energie_voor ?? '-'} → {log.energie_na ?? '-'}</p>
                      {log.notitie && <p className="text-sm text-gray-600 mt-1 italic">"{log.notitie}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {!isLoadingTabData && !tabDataError && activeTab === 'reflecties' && (
             <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Reflecties</h2>
              {reflecties.length === 0 ? <p className="text-gray-500">Geen reflecties gevonden.</p> : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {reflecties.map(r => (
                    <div key={r.id} className="p-3 border rounded-md bg-gray-50">
                      <p className="font-medium text-gray-800">{formatDate(r.datum)} - Stemming: {r.stemming || '-'}</p>
                      {r.notitie && <p className="text-sm text-gray-600 mt-1 italic">"{r.notitie}"</p>}
                      {r.ai_validatie && <p className="text-xs text-purple-600 mt-1">AI: {r.ai_validatie}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {!isLoadingTabData && !tabDataError && activeTab === 'inzichten' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">AI Inzichten</h2>
              {inzichten.length === 0 ? <p className="text-gray-500">Geen AI inzichten beschikbaar.</p> : (
                 <div className="space-y-3">
                  {inzichten.map(i => (
                    <div key={i.id} className="p-3 border rounded-md bg-purple-50 border-purple-200">
                      <p className="font-medium text-purple-800">{i.trend_type || 'Algemeen Inzicht'} ({formatDate(i.created_at)})</p>
                      <p className="text-sm text-purple-700 mt-1">{i.beschrijving}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}