'use client';

import React from 'react';

import { useOnboarding } from '@/context/OnboardingContext';

interface StepNavigationProps {
  className?: string;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({ className = '' }) => {
  const { 
    currentStep, 
    goToNextStep, 
    goToPreviousStep, 
    completeCurrentStep, 
    skipOnboarding,
    progress
  } = useOnboarding();
  
  const isFirstStep = progress.currentStepIndex === 0;
  const isLastStep = progress.currentStepIndex === progress.steps.length - 1;
  const isCurrentStepCompleted = currentStep?.completed || false;
  
  const handleNext = () => {
    if (!isCurrentStepCompleted) {
      completeCurrentStep();
    }
    goToNextStep();
  };
  
  return (
    <div className={`flex justify-between items-center mt-8 ${className}`}>
      {/* Back button (hidden on first step) */}
      {!isFirstStep ? (
        <button
          onClick={goToPreviousStep}
          className="px-4 py-2 text-purple-700 bg-white border border-purple-300 rounded-md hover:bg-purple-50 transition-colors"
        >
          Vorige
        </button>
      ) : (
        <div></div> // Empty div to maintain layout with flex justify-between
      )}
      
      <div className="flex gap-3">
        {/* Skip button (only shown for non-required steps) */}
        {!currentStep?.required && (
          <button
            onClick={skipOnboarding}
            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Overslaan
          </button>
        )}
        
        {/* Next/Complete button */}
        <button
          onClick={handleNext}
          className="px-6 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
        >
          {isLastStep ? 'Voltooien' : 'Volgende'}
        </button>
      </div>
    </div>
  );
};

export default StepNavigation;
