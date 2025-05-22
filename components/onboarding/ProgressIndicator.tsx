'use client';

import React from 'react';

import { useOnboarding } from '@/context/OnboardingContext';

interface ProgressIndicatorProps {
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ className = '' }) => {
  const { progress, goToStep } = useOnboarding();
  const { steps, currentStepIndex } = progress;
  
  // Calculate progress percentage
  const completedSteps = steps.filter(step => step.completed).length;
  const totalRequiredSteps = steps.filter(step => step.required).length;
  const progressPercentage = Math.round((completedSteps / totalRequiredSteps) * 100);
  
  return (
    <div className={`w-full ${className}`}>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-purple-700">Voortgang</span>
          <span className="text-sm font-medium text-purple-700">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-purple-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* Step indicators */}
      <div className="flex flex-wrap gap-2 mb-6">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => {
              // Only allow navigation to completed steps or the current step
              if (step.completed || index === currentStepIndex) {
                goToStep(step.id);
              }
            }}
            disabled={!step.completed && index !== currentStepIndex}
            className={`
              flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all
              ${index === currentStepIndex 
                ? 'bg-purple-600 text-white' 
                : step.completed 
                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
              ${!step.required ? 'border border-dashed border-purple-300' : ''}
            `}
          >
            <span className="mr-1.5">
              {step.completed ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              ) : (
                <span className="w-4 h-4 inline-flex items-center justify-center">{index + 1}</span>
              )}
            </span>
            {step.title}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProgressIndicator;
