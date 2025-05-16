'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { format, parseISO, isToday, isThisWeek, addDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useAuth } from '@/components/auth/AuthProvider';

interface Task {
  id: string;
  titel: string;
  beschrijving: string;
  type: 'taak' | 'opdracht';
  duur: number;
  created_at: string;
}

interface TaskLog {
  id: string;
  task_id: string;
  start_tijd: string;
  eind_tijd: string;
  energie_voor: number;
  energie_na: number;
  pijn_score: number;
  vermoeidheid_score: number;
  stemming: string;
  notitie: string;
  tasks: {
    titel: string;
  };
}

interface Reflectie {
  id: string;
  datum: string;
  stemming: string;
  notitie: string;
}

interface OverzichtClientProps {
  user: User;
  userProfile: any;
  tasks: Task[];
  taskLogs: TaskLog[];
  reflecties: Reflectie[];
  startOfWeek: string;
  endOfWeek: string;
}

export default function OverzichtClient({ 
  user: serverUser, 
  userProfile, 
  tasks, 
  taskLogs, 
  reflecties,
  startOfWeek,
  endOfWeek
}: OverzichtClientProps) {
  // Use the authenticated user from context to ensure consistency
  const { user, loading: authLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Debug logging
  console.log('[OverzichtClient] Rendering with:', { 
    hasServerUser: !!serverUser, 
    hasContextUser: !!user,
    authLoading,
    isClient,
    userProfile,
    tasksCount: tasks?.length,
    taskLogsCount: taskLogs?.length,
    reflectiesCount: reflecties?.length
  });
  
  // If auth is loading or not yet client-side, show a generic loading state
  // This helps prevent hydration mismatch by ensuring server and initial client render are consistent
  if (authLoading || !isClient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" aria-label="Laden..."></div>
        </div>
      </div>
    );
  }
  
  // After client has mounted and auth is no longer loading
  if (!user) { // Rely on the user from AuthProvider once client-side
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">Authenticatie is vereist. U wordt mogelijk doorgestuurd naar de login pagina.</p>
        </div>
      </div>
    );
  }
  
  // At this point, user is authenticated and we are on the client
  const [activeTab, setActiveTab] = useState<'dag' | 'week'>('dag');
  // const [aiInsights, setAiInsights] = useState<string[]>([]);
  
  // // Bereken gemiddelde scores voor de dag
  // const todayLogs = taskLogs.filter(log => isToday(parseISO(log.eind_tijd)));
  // const todayAvgPain = todayLogs.length > 0 
  //   ? Math.round(todayLogs.reduce((sum, log) => sum + log.pijn_score, 0) / todayLogs.length) 
  //   : null;
  // const todayAvgEnergy = todayLogs.length > 0 
  //   ? Math.round(todayLogs.reduce((sum, log) => sum + (log.energie_na - log.energie_voor), 0) / todayLogs.length) 
  //   : null;
  // const todayAvgFatigue = todayLogs.length > 0 
  //   ? Math.round(todayLogs.reduce((sum, log) => sum + log.vermoeidheid_score, 0) / todayLogs.length) 
  //   : null;
  
  // // Bereken gemiddelde scores voor de week
  // const weekAvgPain = taskLogs.length > 0 
  //   ? Math.round(taskLogs.reduce((sum, log) => sum + log.pijn_score, 0) / taskLogs.length) 
  //   : null;
  // const weekAvgEnergy = taskLogs.length > 0 
  //   ? Math.round(taskLogs.reduce((sum, log) => sum + (log.energie_na - log.energie_voor), 0) / taskLogs.length) 
  //   : null;
  // const weekAvgFatigue = taskLogs.length > 0 
  //   ? Math.round(taskLogs.reduce((sum, log) => sum + log.vermoeidheid_score, 0) / taskLogs.length) 
  //   : null;
  
  // // Genereer AI inzichten door reflecties te vergelijken met taak feedback
  // useEffect(() => {
  //   const generateAiInsights = () => {
  //     const insights: string[] = [];
      
  //     // Controleer of er reflecties zijn
  //     if (reflecties.length === 0) {
  //       insights.push("Er zijn nog geen reflecties voor deze week. Voeg dagelijkse reflecties toe om meer inzicht te krijgen in uw voortgang.");
  //       setAiInsights(insights);
  //       return;
  //     }
      
  //     // Controleer of er task logs zijn
  //     if (taskLogs.length === 0) {
  //       insights.push("Er zijn nog geen taken uitgevoerd deze week. Voer taken uit om meer inzicht te krijgen in uw voortgang.");
  //       setAiInsights(insights);
  //       return;
  //     }
      
  //     // Vergelijk reflecties met taak feedback
  //     reflecties.forEach(reflectie => {
  //       const reflectieDatum = parseISO(reflectie.datum);
  //       const logsVanDag = taskLogs.filter(log => {
  //         const logDatum = parseISO(log.eind_tijd);
  //         return logDatum.getDate() === reflectieDatum.getDate() &&
  //                logDatum.getMonth() === reflectieDatum.getMonth() &&
  //                logDatum.getFullYear() === reflectieDatum.getFullYear();
  //       });
        
  //       if (logsVanDag.length > 0) {
  //         // Bereken gemiddelde scores voor de dag
  //         const avgPain = Math.round(logsVanDag.reduce((sum, log) => sum + log.pijn_score, 0) / logsVanDag.length);
  //         const avgEnergy = Math.round(logsVanDag.reduce((sum, log) => sum + (log.energie_na - log.energie_voor), 0) / logsVanDag.length);
  //         const avgFatigue = Math.round(logsVanDag.reduce((sum, log) => sum + log.vermoeidheid_score, 0) / logsVanDag.length);
          
  //         // Controleer of reflectie overeenkomt met taak feedback
  //         const isPositiveReflection = reflectie.stemming === 'goed' || reflectie.stemming === 'zeer goed';
  //         const isNegativeReflection = reflectie.stemming === 'slecht' || reflectie.stemming === 'zeer slecht';
          
  //         const isPositiveTaskFeedback = avgPain < 10 && avgEnergy > 0 && avgFatigue < 10;
  //         const isNegativeTaskFeedback = avgPain > 10 || avgEnergy < 0 || avgFatigue > 10;
          
  //         const reflectieDatumFormatted = format(reflectieDatum, 'EEEE d MMMM', { locale: nl });
          
  //         if (isPositiveReflection && isNegativeTaskFeedback) {
  //           insights.push(`Op ${reflectieDatumFormatted} was uw reflectie positief, maar uw taakmetingen tonen hogere pijn (${avgPain}/20) en vermoeidheid (${avgFatigue}/20). Mogelijk onderschat u de impact van activiteiten op uw lichaam.`);
  //         } else if (isNegativeReflection && isPositiveTaskFeedback) {
  //           insights.push(`Op ${reflectieDatumFormatted} was uw reflectie negatief, maar uw taakmetingen tonen lagere pijn (${avgPain}/20) en vermoeidheid (${avgFatigue}/20). Mogelijk overschat u de impact van activiteiten op uw lichaam.`);
  //         } else if (isPositiveReflection && isPositiveTaskFeedback) {
  //           insights.push(`Op ${reflectieDatumFormatted} komen uw positieve reflectie en taakmetingen overeen. Uw activiteitenniveau lijkt goed afgestemd op uw capaciteiten.`);
  //         } else if (isNegativeReflection && isNegativeTaskFeedback) {
  //           insights.push(`Op ${reflectieDatumFormatted} komen uw negatieve reflectie en taakmetingen overeen. Overweeg om uw activiteitenniveau aan te passen of met uw specialist te overleggen.`);
  //         }
  //       }
  //     });
      
  //     // Voeg algemene inzichten toe als er geen specifieke inzichten zijn
  //     if (insights.length === 0) {
  //       insights.push("Er zijn nog niet genoeg gegevens om specifieke inzichten te genereren. Blijf taken uitvoeren en dagelijkse reflecties toevoegen.");
  //     }
      
  //     setAiInsights(insights);
  //   };
    
  //   generateAiInsights();
  // }, [reflecties, taskLogs]);
  
  // // Genereer weekdagen voor de weekweergave
  // const weekDays = [];
  // const startDate = parseISO(startOfWeek);
  // for (let i = 0; i < 7; i++) {
  //   const date = addDays(startDate, i);
  //   weekDays.push(date);
  // }
  
  return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Overzicht</h1>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('dag')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'dag'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Dagweergave
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'week'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Weekweergave
          </button>
        </div>
        
        {/* Dag weergave */}
        {activeTab === 'dag' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Vandaag - {format(new Date(), 'EEEE d MMMM', { locale: nl })}
            </h2>
            
            {/* Samenvatting (Commented out for simplification) */}
            {/* <div className="bg-white rounded-lg shadow-md p-6 mb-6"> ... </div> */}
            
            {/* Taken van vandaag (Commented out for simplification) */}
            {/* <div className="bg-white rounded-lg shadow-md p-6 mb-6"> ... </div> */}
            
            {/* Reflecties van vandaag (Commented out for simplification) */}
            {/* <div className="bg-white rounded-lg shadow-md p-6 mb-6"> ... </div> */}
          </div>
        )}
        
        {/* Week weergave (Commented out for simplification) */}
        {/* {activeTab === 'week' && ( ... )} */}
      </div>
  );
}
