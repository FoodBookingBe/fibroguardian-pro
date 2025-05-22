'use client';

import dynamic from 'next/dynamic';

// Dynamic imports with loading fallbacks for specialist components
export const SpecialistIntelligenceDashboardComponent = dynamic(
  () => import('@/containers/ai/SpecialistIntelligenceDashboardContainer'),
  {
    loading: () => <div className="w-full h-96 bg-gray-100 animate-pulse rounded-lg"></div>
  }
);

export const KnowledgeManagementComponent = dynamic(
  () => import('@/containers/ai/KnowledgeManagementContainer'),
  {
    loading: () => <div className="w-full h-96 bg-gray-100 animate-pulse rounded-lg"></div>
  }
);
