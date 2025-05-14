'use client';
import { useState, useEffect } from 'react'; // Added useEffect
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Profile, TaskLog, Reflectie, Inzicht, Task } from '@/types'; // Added Task type
import HealthMetricsChart from '@/components/dashboard/HealthMetricsChart'; // Corrected import
// Assuming ErrorAlert is defined or imported, using a placeholder if not.
import { handleSupabaseError } from '@/lib/error-handler';

interface ErrorAlertProps {
  error: { userMessage: string, technicalMessage?: string, action?: string } | string | null;
}
const ErrorAlert = ({ error }: ErrorAlertProps) => {
  if (!error) return null;
  const message = typeof error === 'string' ? error : error.userMessage;
  return <div className="my-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">{message}</div>;
};


interface PatientDetailsProps {
  patient: Profile;
  initialLogs?: TaskLog[]; // Make initial data optional
  initialReflecties?: Reflectie[];
  initialInzichten?: Inzicht[];
  initialTasks?: Task[]; // For displaying assigned tasks
}

export default function PatientDetails({ 
  patient, 
  initialLogs = [], 
  initialReflecties = [], 
  initialInzichten = [],
  initialTasks = []
}: PatientDetailsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'logs' | 'reflecties' | 'inzichten'>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ReturnType<typeof handleSupabaseError> | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  // State for fetched data if not all passed via props or for re-fetching
  const [logs, setLogs] = useState<TaskLog[]>(initialLogs);
  const [reflecties, setReflecties] = useState<Reflectie[]>(initialReflecties);
  const [inzichten, setInzichten] = useState<Inzicht[]>(initialInzichten);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  // Example: Fetch additional data if needed when a tab is clicked or on component mount
  useEffect(() => {
    const fetchDataForTab = async (tab: typeof activeTab) => {
      if (!patient?.id) return;
      setLoading(true);
      try {
        if (tab === 'logs' && logs.length === 0) { // Fetch only if not already loaded
          const { data, error: fetchError } = await supabase.from('task_logs').select('*, tasks(titel)').eq('user_id', patient.id).order('start_tijd', { ascending: false }).limit(50);
          if (fetchError) throw fetchError;
          setLogs(data || []);
        } else if (tab === 'reflecties' && reflecties.length === 0) {
          const { data, error: fetchError } = await supabase.from('reflecties').select('*').eq('user_id', patient.id).order('datum', { ascending: false }).limit(30);
          if (fetchError) throw fetchError;
          setReflecties(data || []);
        } else if (tab === 'inzichten' && inzichten.length === 0) {
            const { data, error: fetchError } = await supabase.from('inzichten').select('*').eq('user_id', patient.id).order('created_at', { ascending: false }).limit(10);
            if (fetchError) throw fetchError;
            setInzichten(data || []);
        } else if (tab === 'tasks' && tasks.length === 0) {
            const { data, error: fetchError } = await supabase.from('tasks').select('*').eq('user_id', patient.id).order('created_at', { ascending: false });
            if (fetchError) throw fetchError;
            setTasks(data || []);
        }
      } catch (err: any) {
        setError(handleSupabaseError(err, `data-ophalen-${tab}`));
      }
      setLoading(false);
    };

    fetchDataForTab(activeTab);
  }, [activeTab, patient?.id, logs.length, reflecties.length, inzichten.length, tasks.length]); // Dependencies

  const formatDate = (dateString?: Date | string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  
  const handleRemovePatient = async () => {
    if (!confirmRemove) {
      setConfirmRemove(true);
      setTimeout(() => setConfirmRemove(false), 3000); // Auto-cancel confirmation
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd als specialist.');
      
      const { error: deleteError } = await supabase
        .from('specialist_patienten')
        .delete()
        .eq('specialist_id', user.id)
        .eq('patient_id', patient.id);
      
      if (deleteError) throw deleteError;
      
      router.push('/specialisten/patienten'); // Navigate back
      router.refresh(); // Refresh server components
    } catch (err: any) {
      setError(handleSupabaseError(err, 'patient-verwijderen'));
    } finally {
      setLoading(false);
      setConfirmRemove(false);
    }
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
  
  const patientAge = calculateAge(patient?.geboortedatum);
  
  const calculateAverages = () => {
    if (!logs || logs.length === 0) return { pijn: null, vermoeidheid: null, energie: null };
    const pijnScores = logs.map(log => log.pijn_score).filter(s => s !== null && s !== undefined) as number[];
    const vermoeidheidScores = logs.map(log => log.vermoeidheid_score).filter(s => s !== null && s !== undefined) as number[];
    const energieNaScores = logs.map(log => log.energie_na).filter(s => s !== null && s !== undefined) as number[];
    const average = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null;
    return { pijn: average(pijnScores), vermoeidheid: average(vermoeidheidScores), energie: average(energieNaScores) };
  };
  
  const averages = calculateAverages();

  const tabOptions = [
    { id: 'overview', label: 'Overzicht' },
    { id: 'tasks', label: `Taken (${tasks.length})` },
    { id: 'logs', label: `Activiteiten (${logs.length})` },
    { id: 'reflecties', label: `Reflecties (${reflecties.length})` },
    { id: 'inzichten', label: `Inzichten (${inzichten.length})` },
  ] as const; // Use const assertion for stricter type on id

  if (!patient) {
    return <div className="p-6 text-center text-gray-500">Patiënt niet gevonden.</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 text-2xl font-semibold">
              {patient.avatar_url ? (
                <img src={patient.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover"/>
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
              onClick={handleRemovePatient}
              disabled={loading}
              className={`btn-secondary whitespace-nowrap ${confirmRemove ? 'bg-red-500 hover:bg-red-600 text-white' : ''}`}
            >
              {loading ? 'Bezig...' : confirmRemove ? 'Bevestig Verwijderen' : 'Koppel Los'}
            </button>
          </div>
        </div>
        {error && <ErrorAlert error={error} />}
      </div>
      
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {tabOptions.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
        
        <div className="p-6 min-h-[300px]"> {/* Added min-h for consistent height */}
          {loading && activeTab !== 'overview' && <div className="text-center py-10">Laden...</div>}
          {!loading && activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Patiënt Overzicht</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center"><div className="text-xs text-gray-500 mb-1">Gem. Pijn</div><div className="text-xl font-bold text-gray-800">{averages.pijn !== null ? `${averages.pijn}/20` : '-'}</div></div>
                <div className="bg-gray-50 rounded-lg p-4 text-center"><div className="text-xs text-gray-500 mb-1">Gem. Vermoeidheid</div><div className="text-xl font-bold text-gray-800">{averages.vermoeidheid !== null ? `${averages.vermoeidheid}/20` : '-'}</div></div>
                <div className="bg-gray-50 rounded-lg p-4 text-center"><div className="text-xs text-gray-500 mb-1">Gem. Energie (na)</div><div className="text-xl font-bold text-gray-800">{averages.energie !== null ? `${averages.energie}/20` : '-'}</div></div>
              </div>
              <div className="h-72 mt-4"><HealthMetricsChart logs={logs} /></div>
            </div>
          )}
          {!loading && activeTab === 'tasks' && (
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
          {!loading && activeTab === 'logs' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Activiteiten Logs</h2>
              {logs.length === 0 ? <p className="text-gray-500">Geen activiteitenlogs gevonden voor deze patiënt.</p> : (
                <div className="space-y-3 max-h-96 overflow-y-auto"> {/* Scrollable logs */}
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
          {!loading && activeTab === 'reflecties' && (
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
          {!loading && activeTab === 'inzichten' && (
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