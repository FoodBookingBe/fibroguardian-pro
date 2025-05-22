import React from 'react';
// utils/accessibility.ts
import { useRef, useEffect } from 'react'; // React import verwijderd

// Helper voor correcte ARIA attributen
export const _ariaProps = {
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
    'aria-live': 'assertive', // Type assertion verwijderd, 'assertive' is een geldige waarde
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
//     <button type="button" aria-label={label} className={className} {...rest} // Type assertion fixed
const _typedRest = rest as Record<string, unknown>;>
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
