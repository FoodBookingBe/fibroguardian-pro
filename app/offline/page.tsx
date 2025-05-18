// app/offline/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check online status on mount
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      // Explicitly return undefined if window is not defined (e.g., during SSR)
      // This path doesn't set up listeners, so no cleanup needed.
      return undefined; 
    }
  }, []);

  return (
    <div className="offline-page-container">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="80" 
        height="80" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="offline-page-svg"
      >
        <path d="M10.68 13.31a16 16 0 0 0 3.64 0M10.68 13.31C7.43 12.62 5 10.41 5 7.7c0-2.25 2.13-4.14 4.92-4.65a16.14 16.14 0 0 1 4.16 0c2.79.51 4.92 2.4 4.92 4.65 0 2.71-2.43 4.92-5.68 5.61"/>
        <path d="M5 18a8 8 0 0 0 4 2c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4Z"/>
        <path d="m13 13 5-5"/>
        <path d="m13 8 5 5"/>
        <path d="M18.5 16.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
      </svg>
      <h1 className="offline-page-title">
        U bent momenteel offline
      </h1>
      <p className="offline-page-text">
        Het lijkt erop dat u geen internetverbinding heeft. Controleer uw verbinding en probeer het opnieuw.
      </p>
      {isOnline ? (
        <p className="offline-page-status-online">U bent nu weer online!</p>
      ) : (
        <p className="offline-page-status-offline">Nog steeds offline. Controleer uw netwerk.</p>
      )}
      <Link href="/" className="offline-page-link">
        Terug naar de startpagina
      </Link>
      <button 
        onClick={() => window.location.reload()}
        className="offline-page-button"
      >
        Probeer opnieuw te laden
      </button>
    </div>
  );
}
