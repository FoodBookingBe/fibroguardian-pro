'use client';

import React, { useState, useEffect } from 'react';

import Link from 'next/link';

import { isOnline } from '@/utils/service-worker';

interface OfflineIndicatorProps {
  className?: string;
}

export default function OfflineIndicator({ className = '' }: OfflineIndicatorProps) {
  const [offline, setOffline] = useState(false);
  
  useEffect(() => {
    // Set initial state
    setOffline(!isOnline());
    
    // Listen for online/offline events
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (!offline) {
    return null;
  }
  
  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-3 flex items-center">
        <div className="flex-shrink-0 mr-3">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
        </div>
        <div className="flex-grow">
          <p className="text-sm text-yellow-700 font-medium">
            Offline modus
          </p>
          <p className="text-xs text-yellow-600">
            Sommige functies zijn beperkt beschikbaar
          </p>
        </div>
        <Link 
          href="/offline/help" 
          className="ml-3 px-2 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded transition-colors"
        >
          Meer info
        </Link>
      </div>
    </div>
  );
}
