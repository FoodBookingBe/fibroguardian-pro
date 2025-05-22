import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
}

export default function MetricCard({ title, value }: MetricCardProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg text-center">
      <h4 className="text-sm text-gray-500 mb-1">{title}</h4>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
