import React from 'react';

import { ReactNode } from 'react';

interface AlertMessageProps {
  type: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  message: string | ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function AlertMessage({ 
  type, 
  title, 
  message, 
  onDismiss, 
  className = '' 
}: AlertMessageProps) {
  const styles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      titleColor: 'text-red-800', // Renamed for clarity
      icon: (
        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      titleColor: 'text-green-800', // Renamed for clarity
      icon: (
        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      titleColor: 'text-yellow-800',
      icon: (
        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.33-.25 3.03-1.742 3.03H4.42c-1.492 0-2.492-1.7-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-3a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      titleColor: 'text-blue-800',
      icon: (
        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      )
    }
  };
  
  const style = styles[type];
  
  if (!message) return null;

  return (
    <div className={`p-4 rounded-md border ${style.bg} ${style.border} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {style.icon}
        </div>
        <div className="ml-3 flex-1">
          {title && <h3 className={`text-sm font-medium ${style.titleColor}`}>{title}</h3>}
          <div className={`text-sm ${style.text} ${title ? 'mt-1' : ''}`}>
            {message}
          </div>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 
                            ${style.bg} 
                            ${type === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-offset-red-50 focus:ring-red-600' : ''}
                            ${type === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-offset-green-50 focus:ring-green-600' : ''}
                            ${type === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-offset-yellow-50 focus:ring-yellow-600' : ''}
                            ${type === 'info' ? 'text-blue-500 hover:bg-blue-100 focus:ring-offset-blue-50 focus:ring-blue-600' : ''}
                          `}
                onClick={onDismiss}
                aria-label="Sluiten"
              >
                <span className="sr-only">Sluiten</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
