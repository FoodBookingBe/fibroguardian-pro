'use client'; // Deze hook is bedoeld voor client-side gebruik
import { trackEvent } from '@/lib/analytics/eventTracking';
import { useLocalStorage } from '@/hooks/useLocalStorage'; // Placeholder hook
import { useEffect, useState, useCallback } from 'react'; // Import useCallback
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

interface FeedbackConfig {
  sessionThreshold: number;
  daysThreshold: number;
  daysInterval: number;
  maxPrompts: number;
  initialDelayMs: number; // Duidelijkere naam
}

const defaultConfig: FeedbackConfig = {
  sessionThreshold: 3,
  daysThreshold: 7,
  daysInterval: 30,
  maxPrompts: 3,
  initialDelayMs: 60 * 1000, // 1 minuut
};

export type FeedbackType = 'nps' | 'general_satisfaction' | 'feature_request' | 'cancellation_reason';

interface FeedbackState {
  lastPromptDateISO: string | null; // Gebruik ISO string voor consistentie
  promptCount: number;
  sessionsCount: number;
  firstUseDateISO: string | null; // Gebruik ISO string
  completedFeedbackTypes: FeedbackType[]; // Hernoemd voor duidelijkheid
}

// Placeholder voor useLocalStorage hook
function useLocalStoragePlaceholder<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    if (typeof window === 'undefined') {
        console.warn(`localStorage not available for key "${key}" (server-side?)`);
        return;
    }
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  };
  return [storedValue, setValue];
}


export function useFeedbackCollector(config?: Partial<FeedbackConfig>) {
  const { user } = useAuth();
  const router = useRouter();
  
  const feedbackConfig = { ...defaultConfig, ...config };
  
  const [feedbackState, setFeedbackState] = useLocalStoragePlaceholder<FeedbackState>(
    `fibro_feedback_state_${user?.id || 'guest'}`, // User-specifieke key
    {
      lastPromptDateISO: null,
      promptCount: 0,
      sessionsCount: 0,
      firstUseDateISO: null,
      completedFeedbackTypes: [],
    }
  );

  // Sessie tracking: Increment session count on mount if user is present
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
        // Check if this is a new session (e.g. by comparing with a session start timestamp)
        // For simplicity, we increment on every "mount" of this hook for a logged-in user,
        // assuming it's instantiated once per user session at a high level.
        // A more robust session tracking might use sessionStorage or a timestamp.
        
        setFeedbackState(prev => {
            const nowISO = new Date().toISOString();
            const newSessionsCount = (sessionStorage.getItem('fibro_session_tracked_this_instance') !== 'true') 
                                     ? prev.sessionsCount + 1 
                                     : prev.sessionsCount;
            if (newSessionsCount > prev.sessionsCount) {
                 sessionStorage.setItem('fibro_session_tracked_this_instance', 'true');
            }

            return {
                ...prev,
                sessionsCount: newSessionsCount,
                firstUseDateISO: prev.firstUseDateISO || nowISO,
            };
        });
    }
  }, [user, setFeedbackState]);


  const shouldPromptFeedback = useCallback((): boolean => {
    if (!user || !feedbackState) return false;

    const { sessionsCount, firstUseDateISO, lastPromptDateISO, promptCount, completedFeedbackTypes } = feedbackState;
    const { sessionThreshold, daysThreshold, daysInterval, maxPrompts } = feedbackConfig;

    if (promptCount >= maxPrompts) return false;
    if (sessionsCount < sessionThreshold) return false;

    if (firstUseDateISO) {
      const daysSinceFirstUse = (Date.now() - new Date(firstUseDateISO).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceFirstUse < daysThreshold) return false;
    } else {
      return false; // No first use date, shouldn't happen if session tracking is working
    }

    if (lastPromptDateISO) {
      const daysSinceLastPrompt = (Date.now() - new Date(lastPromptDateISO).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastPrompt < daysInterval) return false;
    }
    
    return true;
  }, [user, feedbackState, feedbackConfig]);

  const promptFeedback = useCallback((type: FeedbackType, forcePrompt = false): boolean => {
    if (!user) return false;
    if (!forcePrompt && (!shouldPromptFeedback() || feedbackState.completedFeedbackTypes.includes(type))) {
      return false;
    }

    setFeedbackState(prev => ({
      ...prev,
      lastPromptDateISO: new Date().toISOString(),
      promptCount: prev.completedFeedbackTypes.includes(type) ? prev.promptCount : prev.promptCount + 1,
    }));
    
    trackEvent('feedback_prompt_shown', { feedback_type: type });
    router.push(`/feedback?type=${type}`); // Generieke feedback pagina
    return true;
  }, [user, shouldPromptFeedback, feedbackState, setFeedbackState, router]);
  
  const markFeedbackCompleted = useCallback((type: FeedbackType) => {
    if (!feedbackState.completedFeedbackTypes.includes(type)) {
      setFeedbackState(prev => ({
        ...prev,
        completedFeedbackTypes: [...prev.completedFeedbackTypes, type],
      }));
      trackEvent('feedback_submission_success', { feedback_type: type });
    }
  }, [feedbackState, setFeedbackState]);
  
  // Effect om periodiek te checken of feedback gevraagd moet worden
  useEffect(() => {
    if (!user || typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      if (shouldPromptFeedback()) {
        // Bepaal welk type feedback te vragen. Voorbeeld: NPS als eerste.
        if (!feedbackState.completedFeedbackTypes.includes('nps')) {
          promptFeedback('nps');
        } else if (!feedbackState.completedFeedbackTypes.includes('general_satisfaction')) {
          promptFeedback('general_satisfaction');
        }
        // Voeg meer logica toe voor andere types
      }
    }, feedbackConfig.initialDelayMs);

    return () => clearTimeout(timer);
  }, [user, feedbackConfig, feedbackState, shouldPromptFeedback, promptFeedback]);
  
  return {
    promptFeedback,
    markFeedbackCompleted,
    shouldPromptFeedback, // Exposeer voor conditionele UI elementen
    feedbackState, // Voor debug of geavanceerde UI
  };
}
