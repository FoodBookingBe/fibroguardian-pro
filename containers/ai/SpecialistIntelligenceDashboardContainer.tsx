'use client';

import React from 'react';

import SpecialistIntelligenceDashboard from '@/components/ai/SpecialistIntelligenceDashboard';
import { useAuth } from '@/components/auth/AuthProvider';
import { AlertMessage } from '@/components/common/AlertMessage';

interface SpecialistIntelligenceDashboardContainerProps {
  className?: string;
}

/**
 * Container component for the Specialist Intelligence Dashboard
 * Handles authentication and access control
 */
export default function SpecialistIntelligenceDashboardContainer({ 
  className = '' 
}: SpecialistIntelligenceDashboardContainerProps): JSX.Element {
  const { user, profile } = useAuth();

  // Check if user is authenticated
  if (!user) {
    return (
      <div className={`${className} rounded-lg bg-white p-6 shadow-md`}>
        <AlertMessage
          type="error"
          title="Niet ingelogd"
          message="U moet ingelogd zijn om toegang te krijgen tot dit dashboard."
        />
      </div>
    );
  }

  // Check if user is a specialist
  if (profile?.type !== 'specialist' && profile?.type !== 'admin') {
    return (
      <div className={`${className} rounded-lg bg-white p-6 shadow-md`}>
        <AlertMessage
          type="error"
          title="Toegang geweigerd"
          message="Alleen specialisten hebben toegang tot dit dashboard."
        />
      </div>
    );
  }

  return <SpecialistIntelligenceDashboard className={className} />;
}
