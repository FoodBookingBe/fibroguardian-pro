'use client';

interface AdminStats {
  totalUsers: number;
  totalTasks: number;
  totalLogs: number;
  // Add more stats as needed
}

interface AdminStatsCardsProps {
  stats: AdminStats;
}

export default function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  const statItems = [
    { name: 'Totaal Gebruikers', stat: stats.totalUsers, unit: '' },
    { name: 'Totaal Taken', stat: stats.totalTasks, unit: '' },
    { name: 'Totaal Taak Logs', stat: stats.totalLogs, unit: '' },
    // Example: { name: 'Actieve Abonnementen', stat: 15, unit: '' },
  ];

  return (
    <div>
      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statItems.map((item) => (
          <div
            key={item.name}
            className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6"
          >
            <dt className="truncate text-sm font-medium text-gray-500">{item.name}</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              {item.stat}
              {item.unit && <span className="ml-1 text-xl font-medium text-gray-500">{item.unit}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
