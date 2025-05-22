import React from 'react';

'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2'; // react-chartjs-2 na chart.js
import 'chartjs-adapter-date-fns';
import { TaskLog } from '@/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface HeartRateTrendChartProps {
  taskLogs: Pick<TaskLog, 'created_at' | 'hartslag'>[];
}

export default function HeartRateTrendChart({ taskLogs }: HeartRateTrendChartProps) {
  if (!taskLogs || taskLogs.length === 0) {
    return <p className="text-sm text-gray-500">Geen hartslagdata beschikbaar voor grafiek.</p>;
  }

  const filteredLogs = taskLogs
    .filter(log => log.hartslag !== null && log.hartslag !== undefined)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (filteredLogs.length < 2) {
    return <p className="text-sm text-gray-500">Te weinig data voor een hartslagtrend grafiek.</p>;
  }

  const data = {
    labels: filteredLogs.map(log => new Date(log.created_at)),
    datasets: [
      {
        label: 'Hartslag (bpm)',
        data: filteredLogs.map(log => log.hartslag),
        fill: false,
        borderColor: 'rgb(255, 99, 132)', // Roodachtig
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time' as const,
        time: {
          tooltipFormat: 'dd MMM yyyy HH:mm' as const,
          displayFormats: { 
            millisecond: 'HH:mm:ss.SSS',
            second: 'HH:mm:ss',
            minute: 'HH:mm',
            hour: 'HH:mm',
            day: 'dd MMM',
            week: 'll',
            month: 'MMM yyyy',
            quarter: 'qqq yyyy',
            year: 'yyyy',
          }
        },
        title: {
          display: true,
          text: 'Datum',
        },
      },
      y: {
        beginAtZero: false, // Hartslag begint meestal niet bij 0
        // Geen max, laat Chart.js dit bepalen
        title: {
          display: true,
          text: 'Hartslag (bpm)',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Hartslag Trend over Tijd',
      },
    },
  };

  return (
    <div className="h-64 md:h-80">
      <Line data={data} options={options} />
    </div>
  );
}
