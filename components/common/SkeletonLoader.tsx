import React from 'react';

interface SkeletonProps {
  type: 'card' | 'text' | 'avatar' | 'table' | 'chart' | 'listitem'; // Added listitem
  count?: number;
  className?: string;
  textLines?: number; // For multi-line text skeleton
  height?: string; // For custom height, e.g., 'h-8'
}

const SkeletonLoader: React.FC<SkeletonProps> = ({ 
  type, 
  count = 1, 
  className = '',
  textLines = 3,
  height 
}) => {
  const renderSkeleton = (index: number) => {
    switch (type) {
      case 'text':
        return (
          <div key={index} className={`space-y-2 ${className}`}>
            {Array.from({ length: textLines }).map((_, lineIndex) => (
              <div 
                key={`line-${lineIndex}`}
                className={`bg-gray-200 rounded animate-pulse ${height || 'h-4'} ${lineIndex === textLines -1 ? 'w-3/4' : 'w-full'}`}
                style={{ animationDelay: `${index * 0.05 + lineIndex * 0.05}s` }}
                aria-hidden="true"
              ></div>
            ))}
          </div>
        );
      case 'avatar':
        return (
          <div 
            key={index}
            className={`rounded-full bg-gray-200 animate-pulse ${height || 'h-10'} w-${height ? height.substring(2) : '10'} ${className}`}
            style={{ animationDelay: `${index * 0.05}s` }}
            aria-hidden="true"
          ></div>
        );
      case 'chart':
        return (
          <div 
            key={index}
            className={`w-full bg-gray-200 rounded animate-pulse ${height || 'h-64'} ${className}`}
            style={{ animationDelay: `${index * 0.05}s` }}
            aria-hidden="true"
          ></div>
        );
      case 'table':
        return (
          <div key={index} className={`w-full ${className}`} aria-hidden="true">
            <div className="h-10 bg-gray-300 rounded-t animate-pulse mb-1"></div> {/* Darker header */}
            {[...Array(5)].map((_, i) => (
              <div 
                key={`row-${i}`}
                className="h-12 bg-gray-200 rounded mb-1 animate-pulse" // Lighter rows
                style={{ animationDelay: `${i * 0.08}s` }}
              ></div>
            ))}
          </div>
        );
      case 'listitem':
        return (
          <div key={index} className={`flex items-center space-x-3 p-2 bg-gray-100 rounded animate-pulse ${className}`}>
            <div className={`rounded-full bg-gray-300 ${height || 'h-10'} w-${height ? height.substring(2) : '10'}`}></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 rounded w-5/6"></div>
            </div>
          </div>
        );
      case 'card':
      default:
        return (
          <div 
            key={index}
            className={`bg-gray-200 rounded-lg animate-pulse ${height || 'h-32'} ${className}`}
            style={{ animationDelay: `${index * 0.05}s` }}
            aria-hidden="true"
          ></div>
        );
    }
  };

  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <span className="sr-only">Laden...</span> {/* Changed to Dutch */}
      {Array.from({ length: count }).map((_, index) => renderSkeleton(index))}
    </div>
  );
};

export default React.memo(SkeletonLoader);