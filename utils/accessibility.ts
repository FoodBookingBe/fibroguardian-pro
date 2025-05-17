// utils/accessibility.ts
import React, { useRef, useEffect } from 'react'; // Expliciet React importeren, ReactNode and useCallback were unused

// Helper voor correcte ARIA attributen
export const ariaProps = {
  button: (expanded: boolean) => ({
    'aria-expanded': expanded.toString(), 
    'role': 'button',
  }),
  
  checkbox: (checked: boolean) => ({
    'aria-checked': checked, 
    'role': 'checkbox',
  }),
  
  liveRegion: (atomic: boolean = true, relevant?: 'additions' | 'removals' | 'text' | 'all', busy?: boolean) => ({
    'aria-live': 'polite' as 'polite' | 'assertive' | 'off', 
    'aria-atomic': atomic.toString(),
    ...(relevant && { 'aria-relevant': relevant }),
    ...(busy !== undefined && { 'aria-busy': busy.toString() }),
  }),

  tab: (selected: boolean, controlsPanelId: string) => ({
    'role': 'tab',
    'aria-selected': selected.toString(),
    'aria-controls': controlsPanelId,
  }),

  tabPanel: (labelledByTabId: string) => ({
    'role': 'tabpanel',
    'aria-labelledby': labelledByTabId,
  }),
  
  dialog: (isOpen: boolean, titleId: string, describedById?: string) => ({
    'role': 'dialog',
    'aria-modal': isOpen.toString(),
    'aria-labelledby': titleId,
    ...(describedById && { 'aria-describedby': describedById }),
    'aria-hidden': (!isOpen).toString(),
  }),
  
  menuButton: (isOpen: boolean, controlsMenuId: string) => ({
    'aria-haspopup': 'true' as 'true' | 'false' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog',
    'aria-expanded': isOpen.toString(),
    'aria-controls': controlsMenuId,
  }),

  menu: (labelledByButtonId: string) => ({
    'role': 'menu',
    'aria-labelledby': labelledByButtonId,
  }),
  
  sortableItem: (isDragging: boolean) => ({
    'role': 'option',
    'aria-grabbed': isDragging.toString() as 'true' | 'false',
    'tabIndex': 0,
  }),
  
  progress: (value: number, max: number = 100, min: number = 0, valueText?: string) => ({
    'role': 'progressbar',
    'aria-valuenow': value,
    'aria-valuemin': min,
    'aria-valuemax': max,
    ...(valueText && { 'aria-valuetext': valueText }),
  }),
  
  alert: () => ({ 
    'role': 'alert',
    'aria-live': 'assertive' as 'assertive',
    'aria-atomic': 'true',
  }),
};

// Icon button helper
// interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
//   icon: ReactNode;
//   label: string; 
// }

// export function IconButton({ 
//   icon, 
//   label,
//   className,
//   ...rest
// }: IconButtonProps): JSX.Element {
//   return (
//     <button type="button" aria-label={label} className={className} {...rest}>
//       {icon}
//       <span className="sr-only">{label}</span>
//     </button>
//   );
// }

// Screen reader only tekst
// export function SROnly({ children }: { children: ReactNode }): JSX.Element {
//   return <span className="sr-only">{children}</span>;
// }

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

// Focus Trap hook (from plan)
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>, 
  isActive: boolean, 
  onEscape?: () => void
) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) {
      // If trap becomes inactive, try to restore focus if previousFocusRef.current is still valid
      if (!isActive && previousFocusRef.current && document.body.contains(previousFocusRef.current)) {
         // Check if previousFocusRef.current is still in the DOM and focusable
        if (typeof previousFocusRef.current.focus === 'function') {
            // previousFocusRef.current.focus(); // Commented out as per original, might be handled by component managing trap
        }
      }
      return;
    }

    previousFocusRef.current = document.activeElement as HTMLElement;
    
    const focusableElements = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null); // Check if visible and enabled

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }

      if (e.key === 'Tab') {
        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus when trap is deactivated or component unmounts while active
      if (previousFocusRef.current && document.body.contains(previousFocusRef.current) && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive, containerRef, onEscape]);
}

// Example FocusTrap component (optional, hook can be used directly)
// interface FocusTrapComponentProps {
//   isActive: boolean;
//   children: React.ReactNode;
//   onEscape?: () => void;
// }
// export function FocusTrapComponent({ isActive, children, onEscape }: FocusTrapComponentProps): JSX.Element {
//   const containerRef = useRef<HTMLDivElement>(null);
//   useFocusTrap(containerRef, isActive, onEscape);

//   return <div ref={containerRef} tabIndex={-1}>{children}</div>;
// }
