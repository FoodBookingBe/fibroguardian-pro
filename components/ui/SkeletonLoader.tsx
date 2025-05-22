import React from 'react';

interface SkeletonLoaderProps {
  type: 'tasks' | 'profile' | 'logs' | 'reflecties' | 'card' | 'list' | 'form';
  count?: number;
  className?: string;
}

export function SkeletonLoader({ type, count = 3, className = '' }: SkeletonLoaderProps) {
  // Basic card skeleton for demonstration, expand with other types as needed.
  const renderCardSkeleton = (key: number) => (
    <div key={key} className={`bg-white rounded-lg shadow-md p-5 animate-pulse ${className}`}>
      <div className="h-6 bg-gray-200 rounded mb-3 w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
      <div className="h-4 bg-gray-200 rounded mb-4 w-5/6"></div>
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <div className="h-6 bg-gray-200 rounded-md w-20"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  );

  const renderTasksSkeleton = (key: number) => (
    <div key={key} className="bg-white rounded-lg shadow-md p-5 animate-pulse">
      <div className="flex items-start mb-3">
        <div className="flex-shrink-0 mt-1 mr-3 h-6 w-6 bg-gray-200 rounded-full"></div>
        <div className="flex-grow">
          <div className="h-5 bg-gray-200 rounded mb-1 w-3/4"></div>
          <div className="flex flex-wrap gap-2">
            <div className="h-4 bg-gray-200 rounded-full w-16"></div>
            <div className="h-4 bg-gray-200 rounded-full w-20"></div>
          </div>
        </div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <div className="flex space-x-3">
          <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
          <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
          <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded-md w-20"></div>
      </div>
    </div>
  );
  
  // Add other skeleton types as needed based on the design
  // For now, using a generic card for other types or a simple list item
  const renderListItemSkeleton = (key: number) => (
    <div key={key} className={`bg-white rounded-lg shadow-md p-4 animate-pulse ${className}`}>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  );


  switch (type) {
    case 'tasks':
      return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
          {Array(count).fill(0).map((_, i) => renderTasksSkeleton(i))}
        </div>
      );
    case 'profile':
    case 'form':
      return (
        <div className={`bg-white rounded-lg shadow-md p-6 animate-pulse ${className}`}>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          {Array(count).fill(0).map((_, i) => (
            <div key={i} className="mb-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
          <div className="h-10 bg-gray-200 rounded w-1/4 mt-6 ml-auto"></div>
        </div>
      );
    case 'logs':
    case 'reflecties':
    case 'list':
       return (
        <div className={`space-y-3 ${className}`}>
          {Array(count).fill(0).map((_, i) => renderListItemSkeleton(i))}
        </div>
      );
    case 'card':
      return (
        <div className={`space-y-4 ${className}`}>
          {Array(count).fill(0).map((_, i) => renderCardSkeleton(i))}
        </div>
      );
    default:
      return (
        <div className={`space-y-3 ${className}`}>
          {Array(count).fill(0).map((_, i) => (
             <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      );
  }
}
