// hooks/useRefactorPlan.ts
import { useState, useEffect, useCallback } from 'react';

export function useRefactorPlan() {
  const [completedRefactorings, setCompletedRefactorings] = useState<string[]>([]);
  
  // Load from localStorage to persist between sessions
  useEffect(() => {
    if (typeof window !== 'undefined') { // Ensure localStorage is available
      try {
        const saved = localStorage.getItem('fibroguardian-refactoring-progress');
        if (saved) {
          setCompletedRefactorings(JSON.parse(saved));
        }
      } catch (err) {
        console.error('Error loading refactoring progress from localStorage:', err);
      }
    }
  }, []);
  
  const markAsCompleted = useCallback((componentName: string) => {
    setCompletedRefactorings(prev => {
      if (prev.includes(componentName)) {
        return prev; // Already marked
      }
      const updated = [...prev, componentName];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('fibroguardian-refactoring-progress', JSON.stringify(updated));
        } catch (err) {
          console.error('Error saving refactoring progress to localStorage:', err);
        }
      }
      return updated;
    });
  }, []);

  const isCompleted = useCallback((componentName: string): boolean => {
    return completedRefactorings.includes(componentName);
  }, [completedRefactorings]);
  
  return { completedRefactorings, markAsCompleted, isCompleted };
}
