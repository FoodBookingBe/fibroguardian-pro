'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TaskLog } from '@/types';
import { useEffect, useState, useMemo } from 'react'; // Added useMemo

// Define the keys for metrics explicitly for better type safety, matching HealthMetrics component
type PlottableMetricKey = 'pijn_score' | 'vermoeidheid_score' | 'energie_na' | 'hartslag';

interface ChartDataItem {
  originalDate: Date;
  name: string;
  pijn_score?: number;
  vermoeidheid_score?: number;
  energie_na?: number;
  hartslag?: number;
}
interface HealthMetricsChartProps {
  logs: TaskLog[];
  metricKey?: PlottableMetricKey; // Optional specific metric
}

export default function HealthMetricsChart({ logs, metricKey }: HealthMetricsChartProps) {
  // const [chartData, setChartData] = useState<any[]>([]); // Replaced by useMemo
  const [activeMetric, setActiveMetric] = useState<PlottableMetricKey>(metricKey || 'pijn_score');

  useEffect(() => {
    if (metricKey) {
      setActiveMetric(metricKey);
    }
  }, [metricKey]);

  const chartData: ChartDataItem[] = useMemo(() => {
    if (!logs || logs.length === 0) {
      return [];
    }
    return logs.map(log => {
      const date = new Date(log.start_tijd);
      return {
        originalDate: date,
        pijn_score: log.pijn_score,
        vermoeidheid_score: log.vermoeidheid_score,
        energie_na: log.energie_na,
        hartslag: log.hartslag,
        name: date.toLocaleDateString('nl-BE', { day: '2-digit', month: 'short' })
      };
    }).sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime());
  }, [logs]);

  const metricsInfo: Record<PlottableMetricKey, { label: string, color: string, domain?: [number, number | 'auto'] }> = {
    'pijn_score': { label: 'Pijn', color: '#ef4444', domain: [0, 20] },
    'vermoeidheid_score': { label: 'Vermoeidheid', color: '#f97316', domain: [0, 20] },
    'energie_na': { label: 'Energie (na)', color: '#10b981', domain: [0, 20] },
    'hartslag': { label: 'Hartslag', color: '#6366f1', domain: [40, 'auto'] }
  };

  const currentMetricInfo = metricsInfo[activeMetric] || metricsInfo['pijn_score'];

  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">Geen log data beschikbaar voor grafiek.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis domain={currentMetricInfo.domain} tick={{ fontSize: 10 }} />
        <Tooltip
          formatter={(value: number) => [`${value}${activeMetric === 'hartslag' ? ' BPM' : ' /20'}`, currentMetricInfo.label]}
          labelFormatter={(label: string) => `Datum: ${label}`}
        />
        <Legend verticalAlign="top" height={30} />
        <Line
          type="monotone"
          dataKey={activeMetric}
          stroke={currentMetricInfo.color}
          name={currentMetricInfo.label}
          strokeWidth={2}
          activeDot={{ r: 5 }}
          dot={chartData.length < 50} // Show dots if not too many data points
        />
      </LineChart>
    </ResponsiveContainer>
  );
}