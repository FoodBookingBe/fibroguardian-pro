import React from 'react';

'use client';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  return undefined; // Add default return
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-red-50 p-4 rounded-md">
        <h2 className="text-lg font-semibold text-red-700">Er is een fout opgetreden</h2>
        <p className="text-red-600">Probeer opnieuw of ga terug naar het dashboard.</p>
        <button
          onClick={() => reset()}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md"
        >
          Probeer opnieuw
        </button>
      </div>
    </div>
  );
}
