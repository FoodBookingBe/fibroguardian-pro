'use client';


import { TaskLog } from '@/types';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2'; // react-chartjs-2 na chart.js

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale // Register TimeScale
);

interface PainTrendChartProps {
  taskLogs: Pick<TaskLog, 'created_at' | 'pijn_score'>[];
}

export default function PainTrendChart({ taskLogs }: PainTrendChartProps) {
  if (!taskLogs || taskLogs.length === 0) {
    return <p className="text-sm text-gray-500">Geen pijnscore data beschikbaar voor grafiek.</p>;
  }

  // Filter logs met een pijnscore en sorteer op datum
  const filteredLogs = taskLogs
    .filter(log => log.pijn_score !== null && log.pijn_score !== undefined)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (filteredLogs.length < 2) { // Minimaal 2 punten nodig voor een lijn
    return <p className="text-sm text-gray-500">Te weinig data voor een pijntrend grafiek.</p>;
  }

  const data = {
    labels: filteredLogs.map(log => new Date(log.created_at)), // Gebruik Date objecten voor labels
    datasets: [
      {
        label: 'Pijnscore (0-20)', // Aangepast label
        data: filteredLogs.map(log => log.pijn_score),
        fill: false,
        borderColor: 'rgb(192, 75, 192)', // Paarsachtig
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
          // unit: 'day' as const, // Tijdelijk verwijderd om auto-detectie te testen
          tooltipFormat: 'dd MMM yyyy HH:mm' as const,
          displayFormats: { // Zorg dat deze overeenkomen met wat je wilt zien
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
        max: 20, // Aangepast voor Borgschaal of andere 0-20 schaal
        title: {
          display: true,
          text: 'Pijnscore',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Pijntrend over Tijd',
      },
    },
  };

  return (
    <div className="h-64 md:h-80"> {/* Geef de grafiek een vaste hoogte */}
      <Line data={data} options={options} />
    </div>
  );
}
