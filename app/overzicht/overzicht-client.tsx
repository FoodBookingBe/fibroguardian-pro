'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { format, parseISO, isToday, isThisWeek, addDays } from 'date-fns';
import { nl } from 'date-fns/locale';

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
  user, 
  userProfile, 
  tasks, 
  taskLogs, 
  reflecties,
  startOfWeek,
  endOfWeek
}: OverzichtClientProps) {
  const [activeTab, setActiveTab] = useState<'dag' | 'week'>('dag');
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  
  // Bereken gemiddelde scores voor de dag
  const todayLogs = taskLogs.filter(log => isToday(parseISO(log.eind_tijd)));
  const todayAvgPain = todayLogs.length > 0 
    ? Math.round(todayLogs.reduce((sum, log) => sum + log.pijn_score, 0) / todayLogs.length) 
    : null;
  const todayAvgEnergy = todayLogs.length > 0 
    ? Math.round(todayLogs.reduce((sum, log) => sum + (log.energie_na - log.energie_voor), 0) / todayLogs.length) 
    : null;
  const todayAvgFatigue = todayLogs.length > 0 
    ? Math.round(todayLogs.reduce((sum, log) => sum + log.vermoeidheid_score, 0) / todayLogs.length) 
    : null;
  
  // Bereken gemiddelde scores voor de week
  const weekAvgPain = taskLogs.length > 0 
    ? Math.round(taskLogs.reduce((sum, log) => sum + log.pijn_score, 0) / taskLogs.length) 
    : null;
  const weekAvgEnergy = taskLogs.length > 0 
    ? Math.round(taskLogs.reduce((sum, log) => sum + (log.energie_na - log.energie_voor), 0) / taskLogs.length) 
    : null;
  const weekAvgFatigue = taskLogs.length > 0 
    ? Math.round(taskLogs.reduce((sum, log) => sum + log.vermoeidheid_score, 0) / taskLogs.length) 
    : null;
  
  // Genereer AI inzichten door reflecties te vergelijken met taak feedback
  useEffect(() => {
    const generateAiInsights = () => {
      const insights: string[] = [];
      
      // Controleer of er reflecties zijn
      if (reflecties.length === 0) {
        insights.push("Er zijn nog geen reflecties voor deze week. Voeg dagelijkse reflecties toe om meer inzicht te krijgen in uw voortgang.");
        setAiInsights(insights);
        return;
      }
      
      // Controleer of er task logs zijn
      if (taskLogs.length === 0) {
        insights.push("Er zijn nog geen taken uitgevoerd deze week. Voer taken uit om meer inzicht te krijgen in uw voortgang.");
        setAiInsights(insights);
        return;
      }
      
      // Vergelijk reflecties met taak feedback
      reflecties.forEach(reflectie => {
        const reflectieDatum = parseISO(reflectie.datum);
        const logsVanDag = taskLogs.filter(log => {
          const logDatum = parseISO(log.eind_tijd);
          return logDatum.getDate() === reflectieDatum.getDate() &&
                 logDatum.getMonth() === reflectieDatum.getMonth() &&
                 logDatum.getFullYear() === reflectieDatum.getFullYear();
        });
        
        if (logsVanDag.length > 0) {
          // Bereken gemiddelde scores voor de dag
          const avgPain = Math.round(logsVanDag.reduce((sum, log) => sum + log.pijn_score, 0) / logsVanDag.length);
          const avgEnergy = Math.round(logsVanDag.reduce((sum, log) => sum + (log.energie_na - log.energie_voor), 0) / logsVanDag.length);
          const avgFatigue = Math.round(logsVanDag.reduce((sum, log) => sum + log.vermoeidheid_score, 0) / logsVanDag.length);
          
          // Controleer of reflectie overeenkomt met taak feedback
          const isPositiveReflection = reflectie.stemming === 'goed' || reflectie.stemming === 'zeer goed';
          const isNegativeReflection = reflectie.stemming === 'slecht' || reflectie.stemming === 'zeer slecht';
          
          const isPositiveTaskFeedback = avgPain < 10 && avgEnergy > 0 && avgFatigue < 10;
          const isNegativeTaskFeedback = avgPain > 10 || avgEnergy < 0 || avgFatigue > 10;
          
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
      
      // Voeg algemene inzichten toe als er geen specifieke inzichten zijn
      if (insights.length === 0) {
        insights.push("Er zijn nog niet genoeg gegevens om specifieke inzichten te genereren. Blijf taken uitvoeren en dagelijkse reflecties toevoegen.");
      }
      
      setAiInsights(insights);
    };
    
    generateAiInsights();
  }, [reflecties, taskLogs]);
  
  // Genereer weekdagen voor de weekweergave
  const weekDays = [];
  const startDate = parseISO(startOfWeek);
  for (let i = 0; i < 7; i++) {
    const date = addDays(startDate, i);
    weekDays.push(date);
  }
  
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
            
            {/* Samenvatting */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Dagsamenvatting</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-purple-700 mb-1">Gemiddelde pijnscore</h4>
                  <p className="text-2xl font-bold text-purple-800">
                    {todayAvgPain !== null ? `${todayAvgPain}/20` : 'Geen data'}
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-blue-700 mb-1">Gemiddelde energieverandering</h4>
                  <p className="text-2xl font-bold text-blue-800">
                    {todayAvgEnergy !== null ? (todayAvgEnergy > 0 ? `+${todayAvgEnergy}` : todayAvgEnergy) : 'Geen data'}
                  </p>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-amber-700 mb-1">Gemiddelde vermoeidheid</h4>
                  <p className="text-2xl font-bold text-amber-800">
                    {todayAvgFatigue !== null ? `${todayAvgFatigue}/20` : 'Geen data'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Taken van vandaag */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Taken van vandaag</h3>
              
              {todayLogs.length === 0 ? (
                <p className="text-gray-500">Geen taken uitgevoerd vandaag.</p>
              ) : (
                <div className="space-y-4">
                  {todayLogs.map(log => (
                    <div key={log.id} className="border-l-4 border-purple-500 pl-4 py-2">
                      <h4 className="font-medium text-gray-800">{log.tasks.titel}</h4>
                      <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-600">
                        <span>
                          {format(parseISO(log.start_tijd), 'HH:mm')} - {format(parseISO(log.eind_tijd), 'HH:mm')}
                        </span>
                        <span>•</span>
                        <span>Pijn: {log.pijn_score}/20</span>
                        <span>•</span>
                        <span>Energie: {log.energie_voor} → {log.energie_na}</span>
                        <span>•</span>
                        <span>Vermoeidheid: {log.vermoeidheid_score}/20</span>
                      </div>
                      {log.notitie && (
                        <p className="mt-2 text-sm text-gray-600">{log.notitie}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Reflecties van vandaag */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Reflecties van vandaag</h3>
              
              {reflecties.filter(r => isToday(parseISO(r.datum))).length === 0 ? (
                <p className="text-gray-500">Geen reflecties toegevoegd vandaag.</p>
              ) : (
                <div className="space-y-4">
                  {reflecties
                    .filter(r => isToday(parseISO(r.datum)))
                    .map(reflectie => (
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
        
        {/* Week weergave */}
        {activeTab === 'week' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Week van {format(parseISO(startOfWeek), 'd MMMM', { locale: nl })} tot {format(parseISO(endOfWeek), 'd MMMM', { locale: nl })}
            </h2>
            
            {/* Samenvatting */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Weeksamenvatting</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-purple-700 mb-1">Gemiddelde pijnscore</h4>
                  <p className="text-2xl font-bold text-purple-800">
                    {weekAvgPain !== null ? `${weekAvgPain}/20` : 'Geen data'}
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-blue-700 mb-1">Gemiddelde energieverandering</h4>
                  <p className="text-2xl font-bold text-blue-800">
                    {weekAvgEnergy !== null ? (weekAvgEnergy > 0 ? `+${weekAvgEnergy}` : weekAvgEnergy) : 'Geen data'}
                  </p>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-amber-700 mb-1">Gemiddelde vermoeidheid</h4>
                  <p className="text-2xl font-bold text-amber-800">
                    {weekAvgFatigue !== null ? `${weekAvgFatigue}/20` : 'Geen data'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Week kalender */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Weekoverzicht</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {weekDays.map(day => {
                  const dayLogs = taskLogs.filter(log => {
                    const logDate = parseISO(log.eind_tijd);
                    return logDate.getDate() === day.getDate() &&
                           logDate.getMonth() === day.getMonth() &&
                           logDate.getFullYear() === day.getFullYear();
                  });
                  
                  const dayReflecties = reflecties.filter(r => {
                    const reflectieDate = parseISO(r.datum);
                    return reflectieDate.getDate() === day.getDate() &&
                           reflectieDate.getMonth() === day.getMonth() &&
                           reflectieDate.getFullYear() === day.getFullYear();
                  });
                  
                  return (
                    <div key={day.toISOString()} className={`border rounded-md p-3 ${isToday(day) ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                      <h4 className="font-medium text-gray-800 mb-2">
                        {format(day, 'EEEE', { locale: nl })}
                        <span className="ml-1 text-sm text-gray-500">
                          {format(day, 'd/M')}
                        </span>
                      </h4>
                      
                      {dayLogs.length === 0 ? (
                        <p className="text-xs text-gray-500">Geen taken</p>
                      ) : (
                        <div className="space-y-2">
                          {dayLogs.map(log => (
                            <div key={log.id} className="text-xs p-1 bg-purple-100 rounded">
                              <p className="font-medium">{log.tasks.titel}</p>
                              <p className="text-gray-600">
                                {format(parseISO(log.start_tijd), 'HH:mm')} - {format(parseISO(log.eind_tijd), 'HH:mm')}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {dayReflecties.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs font-medium text-blue-600">
                            Reflectie: {dayReflecties[0].stemming}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* AI Inzichten */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">AI Inzichten</h3>
              
              {aiInsights.length === 0 ? (
                <p className="text-gray-500">Geen inzichten beschikbaar.</p>
              ) : (
                <ul className="space-y-3">
                  {aiInsights.map((insight, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-purple-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
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
