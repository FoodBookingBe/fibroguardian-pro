'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
// import { Button } from '@/components/ds/atoms/Button'; // Placeholder
import { trackOnboardingStep, OnboardingStepName } from '@/lib/analytics/userJourney'; // Import OnboardingStepName
import { useLocalStorage } from '@/hooks/useLocalStorage'; // Placeholder hook
// import { useFocusTrap } from '@/lib/accessibility/focus-trap'; // Placeholder hook
import { useAuth } from '@/components/auth/AuthProvider';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // X was unused

// Placeholder voor useFocusTrap hook
const useFocusTrap = (ref: React.RefObject<HTMLElement>, active: boolean) => {
  useEffect(() => {
    if (active && ref.current) {
      // Basic focus trap logic (kan veel uitgebreider)
      const focusableElements = ref.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
      // TODO: Implement full focus trap logic (tabbing, shift-tabbing)
    }
  }, [active, ref]);
};

// Basis Button component
const Button = ({ onClick, children, variant = 'primary', size = 'md', className: btnClassName = '', ...props }: unknown) => (
  <button 
    onClick={onClick} 
    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 disabled:opacity-60 ${btnClassName} ${variant === 'primary' ? 'bg-purple-600 text-white hover:bg-purple-700' : variant === 'ghost' ? 'text-gray-600 hover:bg-gray-100' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    {...props}
  >
    {children}
  </button>
);


export interface TourStep {
  id: string; // Unieke ID voor de stap
  target: string; // CSS selector voor het te highlighten element
  title: string;
  content: React.ReactNode; // Kan JSX bevatten
  position?: 'top' | 'right' | 'bottom' | 'left' | 'center'; // Positie van de tooltip
  beaconPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; // Voor de beacon
  disableBeacon?: boolean;
  isFixed?: boolean; // Of de tooltip fixed position gebruikt (bv. voor modals)
  offset?: { x?: number; y?: number }; // Extra offset voor tooltip
  onNext?: () => void | Promise<void>; // Callback bij 'Volgende'
  onPrev?: () => void | Promise<void>; // Callback bij 'Vorige'
  onSkip?: () => void | Promise<void>; // Callback bij 'Overslaan'
  action?: { // Optionele actieknop in de tooltip
    text: string;
    onClick: () => void | Promise<void>;
  };
}

interface GuidedTourProps {
  tourId: string; // Unieke ID voor de tour (voor localStorage)
  steps: TourStep[];
  onComplete?: () => void; // Callback als de hele tour is voltooid
  onSkipTour?: () => void; // Callback als de hele tour wordt overgeslagen
  autoStart?: boolean; // Start de tour automatisch als nog niet voltooid
  forceStart?: boolean; // Start de tour altijd, negeert localStorage status
  debug?: boolean; // Voor logging
  // Tracking opties
  trackingConfig?: {
    onboardingStepPrefix?: string; // bv. 'dashboard_tour' resulteert in 'dashboard_tour_step_X'
  };
}

export function GuidedTour({
  tourId,
  steps,
  onComplete,
  onSkipTour,
  autoStart = false,
  forceStart = false,
  debug = false,
  trackingConfig,
}: GuidedTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tourCompleted, setTourCompleted] = useLocalStorage(`tour_completed_${tourId}`, false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  useFocusTrap(tooltipRef, isOpen && !!targetElement); // Activeer focus trap als open en target gevonden

  // Start de tour logica
  useEffect(() => {
    if (forceStart) {
      setIsOpen(true);
      setCurrentStepIndex(0);
      setTourCompleted(false); // Reset completed status bij forceStart
      if (debug) console.log(`[Tour ${tourId}] Force started.`);
    } else if (autoStart && !tourCompleted) {
      setIsOpen(true);
      setCurrentStepIndex(0);
      if (debug) console.log(`[Tour ${tourId}] Auto started.`);
    }
  }, [autoStart, forceStart, tourCompleted, tourId, debug, setTourCompleted]);

  // Huidige stap data
  const currentStep = isOpen && steps.length > 0 ? steps[currentStepIndex] : null;

  // Update target element en positie
  const updateTargetAndPosition = useCallback(() => {
    if (!currentStep || !tooltipRef.current) {
      setTargetElement(null);
      return;
    }
    
    const element = document.querySelector(currentStep.target) as HTMLElement | null;
    setTargetElement(element);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      // Highlight logic wordt nu via CSS class gedaan
      // Tooltip positionering
      const targetRect = element.getBoundingClientRect();
      const tooltipNode = tooltipRef.current;
      const { innerWidth, innerHeight, scrollX, scrollY } = window;

      let top = 0, left = 0;
      const tooltipOffset = 10; // Ruimte tussen target en tooltip

      switch (currentStep.position) {
        case 'top':
          top = targetRect.top - tooltipNode.offsetHeight - tooltipOffset;
          left = targetRect.left + (targetRect.width / 2) - (tooltipNode.offsetWidth / 2);
          break;
        case 'bottom':
          top = targetRect.bottom + tooltipOffset;
          left = targetRect.left + (targetRect.width / 2) - (tooltipNode.offsetWidth / 2);
          break;
        case 'left':
          top = targetRect.top + (targetRect.height / 2) - (tooltipNode.offsetHeight / 2);
          left = targetRect.left - tooltipNode.offsetWidth - tooltipOffset;
          break;
        case 'right':
          top = targetRect.top + (targetRect.height / 2) - (tooltipNode.offsetHeight / 2);
          left = targetRect.right + tooltipOffset;
          break;
        default: // center or undefined
          top = innerHeight / 2 - tooltipNode.offsetHeight / 2;
          left = innerWidth / 2 - tooltipNode.offsetWidth / 2;
      }
      
      // Boundary checks
      tooltipNode.style.top = `${Math.max(tooltipOffset, Math.min(top + scrollY, innerHeight + scrollY - tooltipNode.offsetHeight - tooltipOffset))}px`;
      tooltipNode.style.left = `${Math.max(tooltipOffset, Math.min(left + scrollX, innerWidth + scrollX - tooltipNode.offsetWidth - tooltipOffset))}px`;
      
      if (debug) console.log(`[Tour ${tourId}] Step ${currentStepIndex}: Target found, tooltip positioned.`, element);
    } else {
      if (debug) console.warn(`[Tour ${tourId}] Step ${currentStepIndex}: Target "${currentStep.target}" not found.`);
      // Optioneel: ga naar volgende stap of sla over als target niet gevonden wordt
    }
  }, [currentStep, debug, tourId, currentStepIndex]);

  useEffect(() => {
    if (isOpen && currentStep) {
      const timeoutId = setTimeout(updateTargetAndPosition, 100); // Kleine delay voor dynamische content
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, currentStep, updateTargetAndPosition]);
  
  // Event handlers
  const handleNext = async () => {
    if (currentStep?.onNext) await currentStep.onNext();
    if (trackingConfig?.onboardingStepPrefix && user) {
      trackOnboardingStep(`${trackingConfig.onboardingStepPrefix}_step_${currentStepIndex + 1}` as OnboardingStepName, { userId: user.id, tourId, stepId: currentStep?.id });
    }
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = async () => {
    if (currentStep?.onPrev) await currentStep.onPrev();
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSkip = async () => {
    if (currentStep?.onSkip) await currentStep.onSkip();
    setIsOpen(false);
    if (onSkipTour) onSkipTour();
    if (trackingConfig?.onboardingStepPrefix && user && currentStep) {
      trackOnboardingStep(`${trackingConfig.onboardingStepPrefix}_skipped` as OnboardingStepName, { userId: user.id, tourId, skippedAtStepId: currentStep.id });
    }
    if (debug) console.log(`[Tour ${tourId}] Skipped.`);
  };

  const handleComplete = () => {
    setIsOpen(false);
    setTourCompleted(true);
    if (onComplete) onComplete();
    if (trackingConfig?.onboardingStepPrefix && user) {
      trackOnboardingStep(`${trackingConfig.onboardingStepPrefix}_completed` as OnboardingStepName, { userId: user.id, tourId });
    }
    if (debug) console.log(`[Tour ${tourId}] Completed.`);
  };

  // Effect om target highlight te beheren
  useEffect(() => {
    const allTargets = steps.map(s => document.querySelector(s.target)).filter(el => el) as HTMLElement[];
    allTargets.forEach(el => el.classList.remove('guided-tour-highlight'));

    if (isOpen && targetElement) {
      targetElement.classList.add('guided-tour-highlight');
      return () => {
        targetElement.classList.remove('guided-tour-highlight');
      };
    }
  }, [isOpen, targetElement, steps]);


  if (!isOpen || !currentStep) return null;

  return createPortal(
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 z-[1000]" // Overlay
        onClick={handleSkip} // Klik buiten de tooltip om over te slaan
      />
      <div
        ref={tooltipRef}
        className="fixed bg-white rounded-lg shadow-xl p-5 max-w-sm z-[1001] transition-all duration-300 ease-in-out"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`tour-title-${currentStep.id}`}
        aria-describedby={`tour-content-${currentStep.id}`}
      >
        <h3 id={`tour-title-${currentStep.id}`} className="text-lg font-semibold text-gray-800 mb-2">
          {currentStep.title}
        </h3>
        <div id={`tour-content-${currentStep.id}`} className="text-sm text-gray-600 mb-4">
          {currentStep.content}
        </div>

        {currentStep.action && (
          <div className="mb-4">
            <Button variant="outline" size="sm" onClick={currentStep.action.onClick}>
              {currentStep.action.text}
            </Button>
          </div>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-xs">
            Tour overslaan
          </Button>
          <div className="flex items-center space-x-2">
            {currentStepIndex > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrev}>
                <ChevronLeft size={16} className="mr-1" /> Vorige
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={handleNext}>
              {currentStepIndex === steps.length - 1 ? 'Voltooien' : 'Volgende'}
              {currentStepIndex < steps.length - 1 && <ChevronRight size={16} className="ml-1" />}
            </Button>
          </div>
        </div>
         <div className="text-center text-xs text-gray-400 mt-3">
            Stap {currentStepIndex + 1} van {steps.length}
        </div>
      </div>
      <style jsx global>{`
        .guided-tour-highlight {
          outline: 3px solid #8b5cf6; /* Paarse outline */
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3); /* Spotlight effect */
          border-radius: 4px;
          position: relative; /* Noodzakelijk voor z-index stacking context */
          z-index: 1001; /* Boven de overlay, onder de tooltip */
          transition: outline 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
      `}</style>
    </>,
    document.body
  );
}
