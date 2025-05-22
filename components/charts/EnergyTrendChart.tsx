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

interface EnergyTrendChartProps {
  taskLogs: Pick<TaskLog, 'created_at' | 'energie_na' | 'energie_voor'>[]; // energie_voor is optioneel
}

export default function EnergyTrendChart({ taskLogs }: EnergyTrendChartProps) {
  if (!taskLogs || taskLogs.length === 0) {
    return <p className="text-sm text-gray-500">Geen energiedata beschikbaar voor grafiek.</p>;
  }

  // Filter logs met een energie_na score en sorteer op datum
  const filteredLogs = taskLogs
    .filter(log => log.energie_na !== null && log.energie_na !== undefined)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (filteredLogs.length < 2) { // Minimaal 2 punten nodig voor een lijn
    return <p className="text-sm text-gray-500">Te weinig data voor een energietrend grafiek.</p>;
  }

  const datasets = [
    {
      label: 'Energie Na Activiteit (0-20)', // Aangepast naar 0-20 schaal
      data: filteredLogs.map(log => log.energie_na),
      fill: false,
      borderColor: 'rgb(75, 192, 75)', // Groenachtig
      tension: 0.1,
    }
  ];

  // Optioneel: voeg energie_voor toe als een tweede lijn als die data er is
  const energieVoorData = filteredLogs.filter(log => log.energie_voor !== null && log.energie_voor !== undefined);
  if (energieVoorData.length >= 2) { // Alleen toevoegen als er genoeg data is voor een lijn
    datasets.push({
      label: 'Energie Voor Activiteit (0-20)', // Aangepast naar 0-20 schaal
      data: filteredLogs.map(log => log.energie_voor), // Gebruik filteredLogs om x-as consistent te houden
      fill: false,
      borderColor: 'rgb(255, 159, 64)', // Oranjeachtig
      tension: 0.1,
      // borderDash: [5, 5], // Tijdelijk verwijderd om TS error op te lossen
    });
  }


  const data = {
    labels: filteredLogs.map(log => new Date(log.created_at)),
    datasets: datasets,
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
        beginAtZero: true,
        max: 20, // Aangepast naar 0-20 schaal
        title: {
          display: true,
          text: 'Energiescore',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Energie Trend over Tijd',
      },
    },
  };

  return (
    <div className="h-64 md:h-80">
      <Line data={data} options={options} />
    </div>
  );
}
