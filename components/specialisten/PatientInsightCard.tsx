'use client';


import Link from 'next/link';
import { useEffect, useState } from 'react';

import EnergyTrendChart from '@/components/charts/EnergyTrendChart';
import FatigueTrendChart from '@/components/charts/FatigueTrendChart';
import HeartRateTrendChart from '@/components/charts/HeartRateTrendChart';
import PainTrendChart from '@/components/charts/PainTrendChart';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { Reflectie, TaskLog } from '@/types';
// TaskType werd niet gebruikt, dus verwijderd uit imports

interface PatientInsightCardProps {
  patientId: string;
  specialistId: string;
}

type RecentReflection = Pick<Reflectie, 'id' | 'datum' | 'stemming' | 'notitie'>;

interface AverageFeedback {
  avgPijn?: number;
  avgVermoeidheid?: number;
  avgEnergieNa?: number;
  avgHartslag?: number; // Toegevoegd
}

interface InsightData {
  openTasksCount: number;
  completedTasksCount: number;
  totalTasksAssignedBySpecialist: number;
  recentReflections: RecentReflection[];
  averageFeedback?: AverageFeedback;
  allTaskLogsForPainChart: Pick<TaskLog, 'created_at' | 'pijn_score'>[];
  allTaskLogsForFatigueChart: Pick<TaskLog, 'created_at' | 'vermoeidheid_score'>[];
  allTaskLogsForHeartRateChart: Pick<TaskLog, 'created_at' | 'hartslag'>[];
  allTaskLogsForEnergyChart: Pick<TaskLog, 'created_at' | 'energie_na' | 'energie_voor'>[];
}

export default function PatientInsightCard({ patientId, specialistId }: PatientInsightCardProps) {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'pain' | 'fatigue' | 'heartRate' | 'energy'>('pain');
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | 'all'>('30d');
  const [refreshKey, setRefreshKey] = useState(0); // State om refresh te triggeren
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const fetchInsights = async () => { // Definieer fetchInsights binnen useEffect
      setIsLoading(true);
      setError(null);
      try {
        // 1. Fetch alle taken voor tellingen
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('id')
          .eq('user_id', patientId) // Moet altijd voor deze patiënt zijn
          .or(`specialist_id.eq.${specialistId},specialist_id.is.null`) // Taak is van deze specialist OF door patiënt zelf aangemaakt

        if (tasksError) throw tasksError;

        const totalTasks = tasksData?.length || 0;
        let completedTaskIds: Set<string> = new Set();
        let allLogsForCharts: TaskLog[] = []; // Voor alle grafieken

        if (tasksData && tasksData.length > 0) {
          const taskIds = tasksData.map(t => t.id);

          const { data: allLogsData, error: allLogsError } = await supabase
            .from('task_logs')
            .select('*')
            .in('task_id', taskIds)
            .eq('user_id', patientId);

          if (allLogsError) {
            console.warn(`Error fetching all_logs for insights (patient: ${patientId}): ${allLogsError.message}`);
          }
          if (allLogsData) {
            allLogsForCharts = allLogsData as TaskLog[];
            completedTaskIds = new Set(
              allLogsForCharts
                .filter(log => log.eind_tijd !== null && log.eind_tijd !== undefined)
                .map(log => log.task_id)
            );
          }
        }

        const completedTasks = completedTaskIds.size;
        const openTasks = totalTasks - completedTasks;

        const { data: reflectionsData, error: reflectionsError } = await supabase
          .from('reflecties')
          .select('id, datum, stemming, notitie')
          .eq('user_id', patientId)
          .order('datum', { ascending: false })
          .limit(3);

        if (reflectionsError) throw reflectionsError;

        let averageFeedback: AverageFeedback | undefined = undefined;
        const completedTaskLogs = allLogsForCharts.filter(log => completedTaskIds.has(log.task_id));

        if (completedTaskLogs.length > 0) {
          let totalPijn = 0, countPijn = 0;
          let totalVermoeidheid = 0, countVermoeidheid = 0;
          let totalEnergieNa = 0, countEnergieNa = 0;
          let totalHartslag = 0, countHartslag = 0; // Voor hartslag

          completedTaskLogs.forEach(log => {
            if (log.pijn_score !== null && log.pijn_score !== undefined) { totalPijn += log.pijn_score; countPijn++; }
            if (log.vermoeidheid_score !== null && log.vermoeidheid_score !== undefined) { totalVermoeidheid += log.vermoeidheid_score; countVermoeidheid++; }
            if (log.energie_na !== null && log.energie_na !== undefined) { totalEnergieNa += log.energie_na; countEnergieNa++; }
            if (log.hartslag !== null && log.hartslag !== undefined) { totalHartslag += log.hartslag; countHartslag++; } // Hartslag meetellen
          });
          averageFeedback = {
            avgPijn: countPijn > 0 ? parseFloat((totalPijn / countPijn).toFixed(1)) : undefined,
            avgVermoeidheid: countVermoeidheid > 0 ? parseFloat((totalVermoeidheid / countVermoeidheid).toFixed(1)) : undefined,
            avgEnergieNa: countEnergieNa > 0 ? parseFloat((totalEnergieNa / countEnergieNa).toFixed(1)) : undefined,
            avgHartslag: countHartslag > 0 ? parseFloat((totalHartslag / countHartslag).toFixed(0)) : undefined, // Gemiddelde hartslag (afgerond)
          };
        }

        setInsights({
          openTasksCount: openTasks,
          completedTasksCount: completedTasks,
          totalTasksAssignedBySpecialist: totalTasks,
          recentReflections: (reflectionsData as RecentReflection[]) || [],
          averageFeedback,
          allTaskLogsForPainChart: allLogsForCharts.map(log => ({ created_at: log.created_at, pijn_score: log.pijn_score })),
          allTaskLogsForFatigueChart: allLogsForCharts.map(log => ({ created_at: log.created_at, vermoeidheid_score: log.vermoeidheid_score })),
          allTaskLogsForHeartRateChart: allLogsForCharts.map(log => ({ created_at: log.created_at, hartslag: log.hartslag })),
          allTaskLogsForEnergyChart: allLogsForCharts.map(log => ({ created_at: log.created_at, energie_na: log.energie_na, energie_voor: log.energie_voor })),
        });

      } catch (e: unknown) {
        console.error(`Error fetching insights for patient ${patientId}:`, e);
        if (e instanceof Error) {
          setError((e as any).message);
        } else {
          setError('Kon inzichten niet laden door een onbekende fout.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (patientId && specialistId) {
      fetchInsights();
    }
  }, [patientId, specialistId, supabase, refreshKey]); // refreshKey toegevoegd

  // De return statements moeten hier, buiten de useEffect
  if (isLoading) {
    return <SkeletonLoader type="list" count={3} className="h-24" />;
  }

  if (error) {
    return <p className="text-sm text-red-600">Fout: {error}</p>;
  }

  if (!insights) {
    return <p className="text-sm text-gray-500">Geen inzichten beschikbaar.</p>;
  }

  // Debug logs blijven zoals ze waren, na de !insights check

  // Functie om logs te filteren op basis van de geselecteerde periode
  const getFilteredLogsForChart = (logs: Pick<TaskLog, 'created_at' | any>[] | undefined) => {
    if (!logs) return [];
    const now = new Date();
    let startDate = new Date(0); // Begin der tijden voor 'all'

    if (chartPeriod === '7d') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (chartPeriod === '30d') {
      startDate = new Date(now.setDate(now.getDate() - 30));
    }

    return logs.filter(log => new Date(log.created_at) >= startDate);
  };

  const painLogs = getFilteredLogsForChart(insights?.allTaskLogsForPainChart);
  const fatigueLogs = getFilteredLogsForChart(insights?.allTaskLogsForFatigueChart);
  const energyLogs = getFilteredLogsForChart(insights?.allTaskLogsForEnergyChart);
  const heartRateLogs = getFilteredLogsForChart(insights?.allTaskLogsForHeartRateChart);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-700">Taken Overzicht (door u toegewezen):</h4>
        <button
          onClick={() => setRefreshKey(prev => prev + 1)}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 disabled:opacity-50"
        >
          {isLoading ? 'Laden...' : 'Ververs Inzichten'}
        </button>
      </div>
      <div> {/* Deze div was er al voor de taken overzicht info */}
        <p className="text-sm text-gray-600">Totaal: {insights.totalTasksAssignedBySpecialist}</p>
        <p className="text-sm text-green-600">Voltooid: {insights.completedTasksCount}</p>
        <p className="text-sm text-orange-600">Openstaand: {insights.openTasksCount}</p>

        {insights.averageFeedback && (
          <div className="mt-1 text-xs text-gray-500">
            {insights.averageFeedback.avgPijn !== undefined && <span>Gem. Pijn: {insights.averageFeedback.avgPijn}/20 | </span>}
            {insights.averageFeedback.avgVermoeidheid !== undefined && <span>Gem. Vermoeidheid: {insights.averageFeedback.avgVermoeidheid}/20 | </span>}
            {insights.averageFeedback.avgEnergieNa !== undefined && <span>Gem. Energie Na: {insights.averageFeedback.avgEnergieNa}/20 | </span>}
            {insights.averageFeedback.avgHartslag !== undefined && <span>Gem. Hartslag: {insights.averageFeedback.avgHartslag} bpm</span>}
          </div>
        )}
        {/* Recente Taken Details lijst is hier verwijderd */}
      </div>

      <div className="mt-6 border-t pt-4">
        {/* Periode Selectie Knoppen */}
        <div className="mb-4 flex justify-center sm:justify-start space-x-2">
          {(['7d', '30d', 'all'] as const).map(period => (
            <button
              key={period}
              onClick={() => setChartPeriod(period)}
              className={`px-3 py-1 text-xs font-medium rounded-md ${chartPeriod === period
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {period === '7d' && '7 Dagen'}
              {period === '30d' && '30 Dagen'}
              {period === 'all' && 'Alles'}
            </button>
          ))}
        </div>

        <div className="mb-3">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-6 overflow-x-auto pb-1" aria-label="Tabs">
              {['pain', 'fatigue', 'energy', 'heartRate'].map((tab: string) => (
                <button
                  key={tab}
                  onClick={() => setActiveChartTab(tab as 'pain' | 'fatigue' | 'heartRate' | 'energy')}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeChartTab === tab
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab === 'pain' && 'Pijn'}
                  {tab === 'fatigue' && 'Vermoeidheid'}
                  {tab === 'energy' && 'Energie'}
                  {tab === 'heartRate' && 'Hartslag'}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {activeChartTab === 'pain' && (
          <div>
            {painLogs.length > 0 ? (
              <PainTrendChart taskLogs={painLogs} />
            ) : (
              <p className="text-sm text-gray-500 py-4">Geen pijnscore data voor de geselecteerde periode.</p>
            )}
          </div>
        )}
        {activeChartTab === 'fatigue' && (
          <div>
            {fatigueLogs.length > 0 ? (
              <FatigueTrendChart taskLogs={fatigueLogs} />
            ) : (
              <p className="text-sm text-gray-500 py-4">Geen vermoeidheidsscore data voor de geselecteerde periode.</p>
            )}
          </div>
        )}
        {activeChartTab === 'energy' && (
          <div>
            {energyLogs.length > 0 ? (
              <EnergyTrendChart taskLogs={energyLogs} />
            ) : (
              <p className="text-sm text-gray-500 py-4">Geen energiedata voor de geselecteerde periode.</p>
            )}
          </div>
        )}
        {activeChartTab === 'heartRate' && (
          <div>
            {heartRateLogs.length > 0 ? (
              <HeartRateTrendChart taskLogs={heartRateLogs} />
            ) : (
              <p className="text-sm text-gray-500 py-4">Geen hartslagdata voor de geselecteerde periode.</p>
            )}
          </div>
        )}
      </div>

      <div className="border-t pt-3 mt-4">
        <h4 className="font-medium text-gray-700">Recente Reflecties:</h4>
        {insights.recentReflections.length > 0 ? (
          <ul className="list-disc list-inside space-y-1">
            {insights.recentReflections.map((r: RecentReflection) => (
              <li key={r.id} className="text-sm">
                <Link href={`/reflecties/${r.id}`} className="text-purple-600 hover:underline">
                  Reflectie van {new Date(r.datum).toLocaleDateString('nl-BE')}
                  {r.stemming && ` (Stemming: ${r.stemming})`}
                  {r.notitie && r.notitie.length > 20 && ` - ${r.notitie.substring(0, 20)}...`}
                  {r.notitie && r.notitie.length <= 20 && ` - ${r.notitie}`}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Geen recente reflecties.</p>
        )}
      </div>
    </div>
  );
}
