// utils/accessibility.ts
import { useRef, useEffect } from 'react';

// Helper voor correcte ARIA attributen
export const ariaProps = {
  button: (expanded: boolean) => ({
    'aria-expanded': expanded.toString(), // Booleans are fine in React, will render as "true"/"false"
    'role': 'button',
  }),
  
  checkbox: (checked: boolean) => ({
    'aria-checked': checked, // Pass boolean directly, React will handle string conversion
    'role': 'checkbox',
  }),
  
  liveRegion: (atomic: boolean = true, relevant?: 'additions' | 'removals' | 'text' | 'all', busy?: boolean) => ({
    'aria-live': 'polite' as 'polite' | 'assertive' | 'off', // Default to polite
    'aria-atomic': atomic.toString(),
    ...(relevant && { 'aria-relevant': relevant }),
    ...(busy !== undefined && { 'aria-busy': busy.toString() }),
  }),

  tabPanel: (selected: boolean) => ({
    'aria-selected': selected.toString(),
    'role': 'tab', // This should be on the tab itself, panel role is 'tabpanel'
  }),

  // Example for a tab, corresponding to tabPanel
  tab: (selected: boolean, controlsPanelId: string) => ({
    'role': 'tab',
    'aria-selected': selected.toString(),
    'aria-controls': controlsPanelId,
  }),
};

// Focus management hook
export function useFocusManagement<T extends HTMLElement>(shouldFocus: boolean) {
  const elementRef = useRef<T>(null);
  
  useEffect(() => {
    if (shouldFocus && elementRef.current) {
      elementRef.current.focus();
    }
  }, [shouldFocus]);
  
  return elementRef;
}
