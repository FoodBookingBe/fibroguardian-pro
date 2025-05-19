'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface UserSignupDataPoint {
  month: string; // YYYY-MM
  count: number;
}

interface UserSignupsChartProps {
  data: UserSignupDataPoint[];
}

const UserSignupsChart: React.FC<UserSignupsChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">Geen data beschikbaar voor gebruikersaanmeldingen.</p>;
  }

  // Format month for display (e.g., "Jan 2023")
  const formattedData = data.map(item => ({
    ...item,
    displayMonth: new Date(item.month + '-01').toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={formattedData}
        margin={{
          top: 5,
          right: 30,
          left: 0, // Adjusted for YAxis labels
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis dataKey="displayMonth" tick={{ fill: '#6b7280' }} className="text-xs dark:fill-gray-400" />
        <YAxis allowDecimals={false} tick={{ fill: '#6b7280' }} className="text-xs dark:fill-gray-400" />
        <Tooltip
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white
            borderColor: '#cbd5e1', // gray-300
            color: '#1f2937' // gray-800
          }}
          labelStyle={{ color: '#374151' }} // gray-700
        />
        <Legend wrapperStyle={{ color: '#4b5563' }} /> 
        <Line type="monotone" dataKey="count" name="Nieuwe Gebruikers" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default UserSignupsChart;
