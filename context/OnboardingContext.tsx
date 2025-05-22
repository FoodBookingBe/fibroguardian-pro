'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

import { _useAuth as useAuth } from '@/components/auth/AuthProvider';
import { useLocalStorage } from '@/hooks/useLocalStorage';

// Define the onboarding steps
export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  route: string;
  completed: boolean;
  required: boolean;
};

// Define the onboarding progress type
export type OnboardingProgress = {
  steps: OnboardingStep[];
  currentStepIndex: number;
  isCompleted: boolean;
  lastUpdated: string;
};

// Define the context type
type OnboardingContextType = {
  isOnboardingActive: boolean;
  progress: OnboardingProgress;
  currentStep: OnboardingStep | null;
  startOnboarding: () => void;
  skipOnboarding: () => void;
  completeCurrentStep: () => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (stepId: string) => void;
  resetOnboarding: () => void;
};

// Create the context with a default value
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Default onboarding steps for patients
const defaultPatientSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welkom bij FibroGuardian Pro',
    description: 'Leer hoe FibroGuardian Pro u kan helpen bij het beheren van uw fibromyalgie.',
    route: '/onboarding/welcome',
    completed: false,
    required: true,
  },
  {
    id: 'profile',
    title: 'Uw profiel instellen',
    description: 'Vul uw profiel in zodat we de app kunnen personaliseren.',
    route: '/onboarding/profile',
    completed: false,
    required: true,
  },
  {
    id: 'reflections',
    title: 'Dagelijkse reflecties',
    description: 'Leer hoe u dagelijkse reflecties kunt toevoegen om uw symptomen bij te houden.',
    route: '/onboarding/reflections',
    completed: false,
    required: true,
  },
  {
    id: 'tasks',
    title: 'Taken en activiteiten',
    description: 'Ontdek hoe u taken kunt beheren en uw activiteiten kunt bijhouden.',
    route: '/onboarding/tasks',
    completed: false,
    required: true,
  },
  {
    id: 'specialists',
    title: 'Verbinden met specialisten',
    description: 'Leer hoe u kunt verbinden met uw zorgverleners.',
    route: '/onboarding/specialists',
    completed: false,
    required: false,
  },
  {
    id: 'ai-features',
    title: 'AI-ondersteuning',
    description: 'Ontdek hoe AI u kan helpen bij het beheren van uw gezondheid.',
    route: '/onboarding/ai-features',
    completed: false,
    required: false,
  },
];

// Default onboarding steps for specialists
const defaultSpecialistSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welkom bij FibroGuardian Pro',
    description: 'Leer hoe FibroGuardian Pro u kan helpen bij het begeleiden van uw patiënten.',
    route: '/onboarding/welcome',
    completed: false,
    required: true,
  },
  {
    id: 'profile',
    title: 'Uw profiel instellen',
    description: 'Vul uw profiel in zodat patiënten u kunnen vinden.',
    route: '/onboarding/profile',
    completed: false,
    required: true,
  },
  {
    id: 'patients',
    title: 'Patiënten beheren',
    description: 'Leer hoe u patiënten kunt toevoegen en beheren.',
    route: '/onboarding/patients',
    completed: false,
    required: true,
  },
  {
    id: 'insights',
    title: 'Patiënt inzichten',
    description: 'Ontdek hoe u inzichten kunt krijgen in de gezondheid van uw patiënten.',
    route: '/onboarding/insights',
    completed: false,
    required: true,
  },
  {
    id: 'knowledge-base',
    title: 'Kennisbank',
    description: 'Leer hoe u de kennisbank kunt gebruiken en uitbreiden.',
    route: '/onboarding/knowledge-base',
    completed: false,
    required: false,
  },
  {
    id: 'ai-features',
    title: 'AI-ondersteuning',
    description: 'Ontdek hoe AI u kan helpen bij het begeleiden van uw patiënten.',
    route: '/onboarding/ai-features',
    completed: false,
    required: false,
  },
];

// Create a provider component
export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading: isLoading } = useAuth();
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  
  // Initialize with default progress based on user type
  const getDefaultProgress = (): OnboardingProgress => {
    const steps = profile?.type === 'specialist' ? defaultSpecialistSteps : defaultPatientSteps;
    return {
      steps,
      currentStepIndex: 0,
      isCompleted: false,
      lastUpdated: new Date().toISOString(),
    };
  };
  
  // Use local storage to persist onboarding progress
  const [progress, setProgress] = useLocalStorage<OnboardingProgress>(
    'onboarding-progress',
    getDefaultProgress()
  );
  
  // Update default steps when profile type changes
  useEffect(() => {
    if (!isLoading && profile) {
      // Only reset if the user hasn't started onboarding yet
      if (!isOnboardingActive && progress.currentStepIndex === 0 && !progress.steps.some(step => step.completed)) {
        setProgress(getDefaultProgress());
      }
    }
  }, [profile, isLoading, isOnboardingActive, progress.currentStepIndex, progress.steps]);
  
  // Get the current step
  const currentStep = progress.steps[progress.currentStepIndex] || null;
  
  // Start onboarding
  const startOnboarding = () => {
    setIsOnboardingActive(true);
  };
  
  // Skip onboarding
  const skipOnboarding = () => {
    setIsOnboardingActive(false);
    setProgress({
      ...progress,
      isCompleted: true,
      lastUpdated: new Date().toISOString(),
    });
  };
  
  // Complete the current step
  const completeCurrentStep = () => {
    const updatedSteps = [...progress.steps];
    updatedSteps[progress.currentStepIndex] = {
      ...updatedSteps[progress.currentStepIndex],
      completed: true,
    };
    
    // Check if all required steps are completed
    const allRequiredCompleted = updatedSteps
      .filter(step => step.required)
      .every(step => step.completed);
    
    setProgress({
      ...progress,
      steps: updatedSteps,
      isCompleted: allRequiredCompleted,
      lastUpdated: new Date().toISOString(),
    });
  };
  
  // Go to the next step
  const goToNextStep = () => {
    if (progress.currentStepIndex < progress.steps.length - 1) {
      setProgress({
        ...progress,
        currentStepIndex: progress.currentStepIndex + 1,
        lastUpdated: new Date().toISOString(),
      });
    } else {
      // If we're at the last step, mark onboarding as completed
      setIsOnboardingActive(false);
      setProgress({
        ...progress,
        isCompleted: true,
        lastUpdated: new Date().toISOString(),
      });
    }
  };
  
  // Go to the previous step
  const goToPreviousStep = () => {
    if (progress.currentStepIndex > 0) {
      setProgress({
        ...progress,
        currentStepIndex: progress.currentStepIndex - 1,
        lastUpdated: new Date().toISOString(),
      });
    }
  };
  
  // Go to a specific step
  const goToStep = (stepId: string) => {
    const stepIndex = progress.steps.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      setProgress({
        ...progress,
        currentStepIndex: stepIndex,
        lastUpdated: new Date().toISOString(),
      });
    }
  };
  
  // Reset onboarding
  const resetOnboarding = () => {
    setIsOnboardingActive(true);
    setProgress(getDefaultProgress());
  };
  
  // Create the context value
  const contextValue: OnboardingContextType = {
    isOnboardingActive,
    progress,
    currentStep,
    startOnboarding,
    skipOnboarding,
    completeCurrentStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    resetOnboarding,
  };
  
  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
};

// Create a hook to use the onboarding context
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
