'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TaskCompletionDataPoint {
  month: string; // YYYY-MM
  count: number;
}

interface TaskCompletionChartProps {
  data: TaskCompletionDataPoint[];
}

const TaskCompletionChart: React.FC<TaskCompletionChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">Geen data beschikbaar voor taakvoltooiing trends.</p>;
  }

  const formattedData = data.map(item => ({
    ...item,
    displayMonth: new Date(item.month + '-01').toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={formattedData}
        margin={{
          top: 5,
          right: 30,
          left: 0,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis dataKey="displayMonth" tick={{ fill: '#6b7280' }} className="text-xs dark:fill-gray-400" />
        <YAxis allowDecimals={false} tick={{ fill: '#6b7280' }} className="text-xs dark:fill-gray-400" />
        <Tooltip
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.8)', 
            borderColor: '#cbd5e1', 
            color: '#1f2937'
          }}
          labelStyle={{ color: '#374151' }}
        />
        <Legend wrapperStyle={{ color: '#4b5563' }} />
        <Bar dataKey="count" name="Voltooide Taken" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TaskCompletionChart;
