'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';


import { useAuth } from '@/components/auth/AuthProvider';
import { OnboardingProvider, useOnboarding } from '@/context/OnboardingContext';

// Wrapper component that uses the onboarding context
const OnboardingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentStep, isOnboardingActive, progress } = useOnboarding();
  const router = useRouter();
  
  // Redirect to the current step if onboarding is active
  useEffect(() => {
    if (isOnboardingActive && currentStep) {
      router.push(currentStep.route);
    } else if (progress.isCompleted) {
      // If onboarding is completed, redirect to dashboard
      router.push('/dashboard');
    }
  }, [isOnboardingActive, currentStep, router, progress.isCompleted]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
};

// Main layout component that provides the onboarding context
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-24 h-24 bg-purple-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-purple-200 rounded mb-2"></div>
          <div className="h-3 w-24 bg-purple-100 rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <OnboardingProvider>
      <OnboardingWrapper>{children}</OnboardingWrapper>
    </OnboardingProvider>
  );
}
