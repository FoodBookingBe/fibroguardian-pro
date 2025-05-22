'use client';

import React, { Suspense } from 'react';

import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import AIAssistantContainer from '@/containers/ai/AIAssistantContainer';
import AIRecommendationsContainer from '@/containers/ai/AIRecommendationsContainer';

interface DashboardClientProps {
  userRole?: string;
}

export default function DashboardClient({ userRole = 'patient' }: DashboardClientProps) {
  return (
    <div className="mt-8">
      {userRole === 'patient' && (
        <>
          <Suspense fallback={<SkeletonLoader count={1} type="card" />}>
            <AIAssistantContainer className="mb-8" />
          </Suspense>
          
          <Suspense fallback={<SkeletonLoader count={3} type="card" />}>
            <AIRecommendationsContainer 
              limit={3} 
              title="Persoonlijke Aanbevelingen" 
              className="mb-8"
            />
          </Suspense>
        </>
      )}
    </div>
  );
}
