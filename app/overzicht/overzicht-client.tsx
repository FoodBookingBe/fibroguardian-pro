import React from 'react';

'use client';

import { useState, useEffect, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { format, parseISO, isToday, addDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import { _useAuth as useAuth } from '@/components/auth/AuthProvider';
import MetricCard from '@/components/overzicht/MetricCard'; 
import { Task, TaskLog as GlobalTaskLog, Reflectie } from '@/types'; 

// Helper functions for calculations
const calculateAveragePain = (logs: ComponentTaskLog[]): string => {
  if (!logs || logs.length === 0) return 'Geen data';
  const validLogs = logs.filter(log => typeof log.pijn_score === 'number');
  if (validLogs.length === 0) return 'Geen data';
  const avg = Math.round(validLogs.reduce((sum, log) => sum + (log.pijn_score ?? 0), 0) / validLogs.length);
  return `${avg}/20`;
};

const calculateAverageEnergy = (logs: ComponentTaskLog[]): string => {
  if (!logs || logs.length === 0) return 'Geen data';
  const validLogs = logs.filter(log => typeof log.energie_na === 'number' && typeof log.energie_voor === 'number');
  if (validLogs.length === 0) return 'Geen data';
  const avgChange = Math.round(validLogs.reduce((sum, log) => sum + ((log.energie_na ?? 0) - (log.energie_voor ?? 0)), 0) / validLogs.length);
  return avgChange > 0 ? `+${avgChange}` : avgChange.toString();
};

const calculateAverageFatigue = (logs: ComponentTaskLog[]): string => {
  if (!logs || logs.length === 0) return 'Geen data';
  const validLogs = logs.filter(log => typeof log.vermoeidheid_score === 'number');
  if (validLogs.length === 0) return 'Geen data';
  const avg = Math.round(validLogs.reduce((sum, log) => sum + (log.vermoeidheid_score ?? 0), 0) / validLogs.length);
  return `${avg}/20`;
};

// Define a more specific TaskLog type for this component if it includes joined data like 'tasks.titel'
interface ComponentTaskLog extends GlobalTaskLog {
  tasks?: { 
    titel: string;
  };
}

interface OverzichtClientProps {
  user: User;
  userProfile: unknown; 
  tasks: Task[];
  taskLogs: ComponentTaskLog[]; 
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
  const { user, loading: authLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<'dag' | 'week'>('dag');

  useEffect(() => {
    setIsClient(true);
  return undefined; // Add default return
  }, []);

  const aiInsights = useMemo(() => {
    if (!isClient) return []; // Don't compute on server or before client mount

    const insights: string[] = [];
    
    if (!reflecties || reflecties.length === 0) {
      insights.push("Er zijn nog geen reflecties voor deze week. Voeg dagelijkse reflecties toe om meer inzicht te krijgen in uw voortgang.");
      return insights;
    }
    
    if (!taskLogs || taskLogs.length === 0) {
      insights.push("Er zijn nog geen taken uitgevoerd deze week. Voer taken uit om meer inzicht te krijgen in uw voortgang.");
      return insights;
    }
    
    reflecties.forEach(reflectie => {
      // reflectie.datum is a Date object as per Reflectie type
      const reflectieDatum = reflectie.datum; 
      
      // Ensure reflectieDatum is a valid Date object before proceeding
      if (!(reflectieDatum instanceof Date) || isNaN(reflectieDatum.getTime())) {
        console.warn(`Invalid Date object for reflectie ${reflectie.id}:`, reflectieDatum);
        return; // Skip this reflection if date is invalid
      }

      const logsVanDag = taskLogs.filter(log => {
        if (!log.eind_tijd || typeof log.eind_tijd !== 'string') return false;
        // Add a check for valid date string before parsing
        try {
          const logDatum = parseISO(log.eind_tijd);
          return logDatum.getDate() === reflectieDatum.getDate() &&
                 logDatum.getMonth() === reflectieDatum.getMonth() &&
                 logDatum.getFullYear() === reflectieDatum.getFullYear();
        } catch (e) {
          console.warn(`Invalid date string for taskLog ${log.id}: ${log.eind_tijd}`);
          return false;
        }
      });
      
      if (logsVanDag.length > 0) {
        const validPainLogs = logsVanDag.filter(l => typeof l.pijn_score === 'number');
        const avgPain = validPainLogs.length > 0 ? Math.round(validPainLogs.reduce((sum, log) => sum + (log.pijn_score ?? 0), 0) / validPainLogs.length) : 0;
        
        const validEnergyLogs = logsVanDag.filter(l => typeof l.energie_na === 'number' && typeof l.energie_voor === 'number');
        const avgEnergyChange = validEnergyLogs.length > 0 ? Math.round(validEnergyLogs.reduce((sum, log) => sum + ((log.energie_na ?? 0) - (log.energie_voor ?? 0)), 0) / validEnergyLogs.length) : 0;

        const validFatigueLogs = logsVanDag.filter(l => typeof l.vermoeidheid_score === 'number');
        const avgFatigue = validFatigueLogs.length > 0 ? Math.round(validFatigueLogs.reduce((sum, log) => sum + (log.vermoeidheid_score ?? 0), 0) / validFatigueLogs.length) : 0;
        
        const isPositiveReflection = reflectie.stemming === 'goed' || reflectie.stemming === 'zeer goed';
        const isNegativeReflection = reflectie.stemming === 'slecht' || reflectie.stemming === 'zeer slecht';
        
        const isPositiveTaskFeedback = avgPain < 10 && avgEnergyChange > 0 && avgFatigue < 10;
        const isNegativeTaskFeedback = avgPain > 10 || avgEnergyChange < 0 || avgFatigue > 10;
        
        const reflectieDatumFormatted = format(reflectieDatum, 'EEEE d MMMM', { locale: nl });
        
        if (isPositiveReflection && isNegativeTaskFeedback) {
          insights.push(`Op ${reflectieDatumFormatted} was uw reflectie positief, maar uw taakmetingen tonen hogere pijn (${avgPain}/20) en vermoeidheid (${avgFatigue}/20). Mogelijk onderschat u de impact van activiteiten op uw lichaam.`);
        } else if (isNegativeReflection && isPositiveTaskFeedback) {
          insights.push(`Op ${reflectieDatumFormatted} was uw reflectie negatief, maar uw taakmetingen tonen lagere pijn (${avgPain}/20) en vermoeidheid (${avgFatigue}/20). Mogelijk overschat u de impact van activiteiten op uw lichaam.`);
        } else if (isPositiveReflection && isPositiveTaskFeedback) {
          insights.push(`Op ${reflectieDatumFormatted} komen uw positieve reflectie en taakmetingen overeen. Uw activiteitenniveau lijkt goed afgestemd op uw capaciteiten.`);
        } else if (isNegativeReflection && isNegativeTaskFeedback) {
          insights.push(`Op ${reflectieDatumFormatted} komen uw negatieve reflectie en taakmetingen overeen. Overweeg om uw activiteitenniveau aan te passen of met uw specialist te overleggen.`);
        }
      }
    });
    
    if (insights.length === 0) {
      insights.push("Er zijn nog niet genoeg gegevens om specifieke inzichten te genereren. Blijf taken uitvoeren en dagelijkse reflecties toevoegen.");
    }
    
    return insights;
  }, [reflecties, taskLogs, isClient]);
  
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
  
  if (authLoading || !isClient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" aria-label="Laden..."></div>
        </div>
      </div>
    );
  }
  
  if (!user) { 
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">Authenticatie is vereist. U wordt mogelijk doorgestuurd naar de login pagina.</p>
        </div>
      </div>
    );
  }
  
  // const [activeTab, setActiveTab] = useState<'dag' | 'week'>('dag'); // Moved up
  // const [aiInsights, setAiInsights] = useState<string[]>([]); // Moved up
  
  const todayLogs = (taskLogs || []).filter(log => log.eind_tijd && typeof log.eind_tijd === 'string' && isToday(parseISO(log.eind_tijd)));
  
  // useEffect for generateAiInsights moved up before conditional returns
  
  const weekDays: Date[] = [];
  if (startOfWeek && typeof startOfWeek === 'string') {
    const startDate = parseISO(startOfWeek);
    for (let i = 0; i < 7; i++) {
      weekDays.push(addDays(startDate, i));
    }
  }
  
  return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Overzicht</h1>
        
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
        
        {activeTab === 'dag' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Vandaag - {format(new Date(), 'EEEE d MMMM', { locale: nl })}
            </h2>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Dagsamenvatting</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard 
                  title="Gemiddelde Pijn" 
                  value={calculateAveragePain(todayLogs)} 
                />
                <MetricCard 
                  title="Gemiddelde Energieverandering" 
                  value={calculateAverageEnergy(todayLogs)} 
                />
                <MetricCard 
                  title="Gemiddelde Vermoeidheid" 
                  value={calculateAverageFatigue(todayLogs)} 
                />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Taken van vandaag</h3>
              {todayLogs.length === 0 ? (
                <p className="text-gray-500">Geen taken uitgevoerd vandaag.</p>
              ) : (
                <div className="space-y-4">
                  {todayLogs.map(log => (
                    <div key={log.id} className="border-l-4 border-purple-500 pl-4 py-2">
                      <h4 className="font-medium text-gray-800">{log.tasks?.titel || 'Onbekende taak'}</h4>
                      <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-600">
                        <span>{log.start_tijd && typeof log.start_tijd === 'string' ? format(parseISO(log.start_tijd), 'HH:mm') : ''} - {log.eind_tijd && typeof log.eind_tijd === 'string' ? format(parseISO(log.eind_tijd), 'HH:mm') : ''}</span>
                        <span>•</span><span>Pijn: {log.pijn_score ?? 'N/A'}/20</span>
                        <span>•</span><span>Energie: {log.energie_voor ?? 'N/A'} → {log.energie_na ?? 'N/A'}</span>
                        <span>•</span><span>Vermoeidheid: {log.vermoeidheid_score ?? 'N/A'}/20</span>
                      </div>
                      {log.notitie && <p className="mt-2 text-sm text-gray-600">{log.notitie}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Reflecties van vandaag</h3>
              {(!reflecties || reflecties.filter(r => r.datum && typeof r.datum === 'string' && isToday(parseISO(r.datum))).length === 0) ? (
                <p className="text-gray-500">Geen reflecties toegevoegd vandaag.</p>
              ) : (
                <div className="space-y-4">
                  {reflecties.filter(r => r.datum && typeof r.datum === 'string' && isToday(parseISO(r.datum))).map(reflectie => (
                      <div key={reflectie.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">Stemming: {reflectie.stemming}</span>
                        </div>
                        <p className="mt-2 text-gray-600">{reflectie.notitie}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'week' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Week van {startOfWeek && typeof startOfWeek === 'string' ? format(parseISO(startOfWeek), 'd MMMM', { locale: nl }) : ''} tot {endOfWeek && typeof endOfWeek === 'string' ? format(parseISO(endOfWeek), 'd MMMM', { locale: nl }) : ''}
            </h2>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Weeksamenvatting</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <MetricCard 
                  title="Gemiddelde Pijn" 
                  value={calculateAveragePain(taskLogs || [])} 
                />
                <MetricCard 
                  title="Gemiddelde Energieverandering" 
                  value={calculateAverageEnergy(taskLogs || [])} 
                />
                <MetricCard 
                  title="Gemiddelde Vermoeidheid" 
                  value={calculateAverageFatigue(taskLogs || [])} 
                />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Weekoverzicht</h3>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {weekDays.map(day => {
                  const dayLogs = (taskLogs || []).filter(log => {
                    if(!log.eind_tijd || typeof log.eind_tijd !== 'string') return false;
                    const logDate = parseISO(log.eind_tijd);
                    return logDate.getDate() === day.getDate() &&
                           logDate.getMonth() === day.getMonth() &&
                           logDate.getFullYear() === day.getFullYear();
                  });
                  const dayReflecties = (reflecties || []).filter(r => {
                    if(!r.datum || typeof r.datum !== 'string') return false;
                    const reflectieDate = parseISO(r.datum);
                    return reflectieDate.getDate() === day.getDate() &&
                           reflectieDate.getMonth() === day.getMonth() &&
                           reflectieDate.getFullYear() === day.getFullYear();
                  });
                  return (
                    <div key={day.toISOString()} className={`border rounded-md p-3 ${isToday(day) ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                      <h4 className="font-medium text-gray-800 mb-2">
                        {format(day, 'EEEE', { locale: nl })}
                        <span className="ml-1 text-sm text-gray-500">{format(day, 'd/M')}</span>
                      </h4>
                      {dayLogs.length === 0 ? (
                        <p className="text-xs text-gray-500">Geen taken</p>
                      ) : (
                        <div className="space-y-2">
                          {dayLogs.map(log => (
                            <div key={log.id} className="text-xs p-1 bg-purple-100 rounded">
                              <p className="font-medium">{log.tasks?.titel || 'Onbekende taak'}</p>
                              <p className="text-gray-600">{log.start_tijd && typeof log.start_tijd === 'string' ? format(parseISO(log.start_tijd), 'HH:mm') : ''} - {log.eind_tijd && typeof log.eind_tijd === 'string' ? format(parseISO(log.eind_tijd), 'HH:mm') : ''}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {dayReflecties.length > 0 && dayReflecties[0].stemming && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs font-medium text-blue-600">Reflectie: {dayReflecties[0].stemming}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">AI Inzichten</h3>
              {(!aiInsights || aiInsights.length === 0) ? ( 
                <p className="text-gray-500">Geen inzichten beschikbaar.</p>
              ) : (
                <ul className="space-y-3">
                  {aiInsights.map((insight, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-purple-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <span className="text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
  );
}
