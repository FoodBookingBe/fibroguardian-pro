import React from 'react';

import { ReactNode } from 'react';
import { SkeletonLoader } from './SkeletonLoader'; // Assumes SkeletonLoader is in the same ui directory
import { AlertMessage } from '@/components/common/AlertMessage'; // Path to existing AlertMessage
import { ErrorResponse } from '@/types/core'; // Path to core types
import { ErrorMessage } from '@/lib/error-handler'; // Import ErrorMessage

interface ConditionalRenderProps<T> {
  isLoading: boolean;
  isError: boolean;
  error: ErrorResponse | ErrorMessage | null; // Allow ErrorMessage from hooks too
  data: T | undefined | null;
  loadingFallback?: ReactNode;
  errorFallback?: ReactNode;
  emptyFallback?: ReactNode;
  skeletonType?: 'tasks' | 'profile' | 'logs' | 'reflecties' | 'card' | 'list' | 'form' | 'default'; // Match SkeletonLoader types
  children: (data: NonNullable<T>) => ReactNode;
}

export function ConditionalRender<T>({
  isLoading,
  isError,
  error,
  data,
  loadingFallback,
  errorFallback,
  emptyFallback,
  skeletonType = 'default',
  children
}: ConditionalRenderProps<T>): ReactNode {
  if (isLoading) {
    // If a specific loading fallback is provided, use it. Otherwise, use SkeletonLoader.
    if (loadingFallback) return loadingFallback;
    // Ensure skeletonType is a valid key for SkeletonLoader or handle 'default'
    const validSkeletonType = skeletonType === 'default' ? 'card' : skeletonType; // Example default
    return <SkeletonLoader type={validSkeletonType} />;
  }
  
  const typedError = error as (ErrorResponse | ErrorMessage | null); // Help TS with union type

  if (isError) {
    if (errorFallback) return errorFallback;
    // Try to get a user-friendly message, accommodating both ErrorResponse and ErrorMessage
    const errorMessage = 
      (typedError && 'userMessage' in typedError && typedError.userMessage) || // For ErrorMessage
      (typedError && 'message' in typedError && typedError.message) ||         // For ErrorResponse or generic Error
      'Er is een onbekende fout opgetreden.';
    return (
      <AlertMessage 
        type="error" 
        message={errorMessage} 
      />
    );
  }
  
  // Check for null or undefined data, or empty array if data is an array
  const isDataEmpty = data === null || data === undefined || (Array.isArray(data) && data.length === 0);

  if (isDataEmpty) {
    return emptyFallback || <div className="p-4 text-center text-gray-500">Geen gegevens beschikbaar.</div>;
  }
  
  // At this point, data is non-nullable and not an empty array (if it was an array)
  // The NonNullable<T> cast might still be needed if T itself could be an empty array type.
  // However, if data is an empty array, isDataEmpty would be true.
  // So, if we reach here and data was an array, it's a non-empty array.
  return children(data as NonNullable<T>);
}
