import React from 'react';

export default function TaskLogsLoadingSkeleton(): JSX.Element {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Activiteiten Logs</h2>
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-200 h-16 rounded-md"></div>
        ))}
      </div>
    </div>
  );
}
