import React from 'react';

'use client';

import dynamic from 'next/dynamic';

// Dynamic imports with loading fallbacks
export const AdminStatsCards = dynamic(() => import('@/components/admin/AdminStatsCards'), {
  loading: () => <div className="w-full h-32 bg-gray-100 animate-pulse rounded-lg"></div>
});

export const RecentUsersTable = dynamic(() => import('@/components/admin/RecentUsersTable'), {
  loading: () => <div className="w-full h-64 bg-gray-100 animate-pulse rounded-lg"></div>
});
