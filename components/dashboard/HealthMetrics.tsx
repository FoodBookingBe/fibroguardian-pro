'use client';

import { TaskLog } from '@/types';
import { useMemo, useState } from 'react'; // Changed useEffect to useMemo
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Define the keys for metrics explicitly for better type safety
type MetricKey = 'pijn' | 'vermoeidheid' | 'energie_voor' | 'energie_na' | 'hartslag';

interface ChartDataItem {
  originalDate: Date;
  name: string;
  pijn?: number;
  vermoeidheid?: number;
  energie_voor?: number;
  energie_na?: number;
  hartslag?: number;
  // No index signature needed if we use MetricKey for activeMetric
}

interface HealthMetricsProps {
  logs: TaskLog[];
}

export default function HealthMetrics({ logs }: HealthMetricsProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('pijn'); // Use MetricKey type
  // const [chartData, setChartData] = useState<any[]>([]); // Replaced by useMemo

  const chartData: ChartDataItem[] = useMemo(() => {
    if (!logs || logs.length === 0) {
      return [];
    }
    return logs.map(log => {
      const date = new Date(log.start_tijd);
      return {
        originalDate: date,
        pijn: log.pijn_score,
        vermoeidheid: log.vermoeidheid_score,
        energie_voor: log.energie_voor,
        energie_na: log.energie_na,
        hartslag: log.hartslag,
        name: date.toLocaleDateString('nl-BE', {
          day: '2-digit',
          month: '2-digit',
        })
      };
    })
      .sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime());
  }, [logs]);

  const metrics: Array<{ key: MetricKey; label: string; color: string }> = [
    { key: 'pijn', label: 'Pijn', color: '#ef4444' },
    { key: 'vermoeidheid', label: 'Vermoeidheid', color: '#f97316' },
    { key: 'energie_voor', label: 'Energie (voor)', color: '#84cc16' },
    { key: 'energie_na', label: 'Energie (na)', color: '#10b981' },
    { key: 'hartslag', label: 'Hartslag', color: '#6366f1' }
  ];

  // Vind de huidige metriek
  const currentMetric = metrics.find(m => m.key === activeMetric);

  const recentMoods = useMemo(() => {
    // Filter logs die een stemming hebben en sorteer op datum
    return logs
      .filter(log => log.stemming !== undefined && log.stemming !== null)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5); // Toon de 5 meest recente stemmingen
  }, [logs]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6" aria-labelledby="health-metrics-title">
      <h2 id="health-metrics-title" className="text-lg font-semibold mb-4 text-gray-800">Gezondheidsmetrieken</h2>

      {/* Metriek selectie */}
      <div className="mb-4">
        <label id="metric-selector-label" className="sr-only">Selecteer metriek</label>
        <div
          className="flex flex-wrap gap-2 mb-3"
          role="radiogroup"
          aria-labelledby="metric-selector-label"
        >
          {metrics.map(metric => (
            <button
              key={metric.key}
              type="button"
              onClick={() => setActiveMetric(metric.key)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${activeMetric === metric.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              role="radio"
              aria-checked={activeMetric === metric.key ? 'true' : 'false'}
              aria-label={`Bekijk ${metric.label} data`}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grafiek gebied */}
      <div className="h-64" aria-live="polite">
        {chartData.length > 0 ? (
          <>
            <div className="sr-only" aria-live="assertive">
              Grafiek van {currentMetric?.label || activeMetric} gegevens over tijd.
              {chartData.map((item, index) => (
                <span key={index}>
                  {item.name}: {item[activeMetric as MetricKey]}
                  {activeMetric === 'hartslag' ? ' BPM' : ' op schaal van 20'}.
                </span>
              ))}
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 10, left: -20, bottom: 20 }}
                aria-label={`Lijndiagram van ${currentMetric?.label || activeMetric} over tijd`}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 10 }}
                  aria-label="Tijd"
                />
                <YAxis
                  domain={activeMetric === 'hartslag' ? [40, 'auto'] : [0, 20]}
                  allowDataOverflow={true}
                  tick={{ fontSize: 10 }}
                  aria-label={currentMetric?.label || activeMetric.toString()}
                />
                <Tooltip
                  formatter={(value: number) => [`${value} ${activeMetric === 'hartslag' ? 'BPM' : '/ 20'}`, currentMetric?.label || activeMetric]}
                  labelFormatter={(label: string) => `Datum: ${label}`}
                />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey={activeMetric}
                  stroke={currentMetric?.color || '#8884d8'}
                  activeDot={{ r: 6 }}
                  strokeWidth={2}
                  name={currentMetric?.label || activeMetric.toString()}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div className="flex items-center justify-center h-full border-2 border-dashed border-gray-300 rounded-lg p-4">
            <p className="text-gray-500 text-center">
              Nog geen gegevens beschikbaar. Voer taken uit om metrieken te verzamelen.
            </p>
          </div>
        )}
      </div>

      {/* Recente Stemmingen sectie */}
      <div className="mt-6 border-t pt-4">
        <h3 className="font-medium text-gray-700 mb-2">Recente Stemmingen:</h3>
        {recentMoods.length > 0 ? (
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {recentMoods.map((log, index) => (
              <li key={log.id || index}>
                {new Date(log.created_at).toLocaleDateString('nl-BE')}: {log.stemming}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Geen recente stemmingen gelogd.</p>
        )}
      </div>

      {/* Legende en uitleg */}
      <div className="mt-6 text-sm text-gray-600" aria-live="polite">
        <p>
          {activeMetric === 'hartslag' ? (
            <>Hartslag wordt gemeten in BPM (slagen per minuut).</>
          ) : (
            <>
              {currentMetric?.label || activeMetric} wordt gemeten op een schaal van 1-20,
              waarbij 1 de laagste waarde is en 20 de hoogste.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
