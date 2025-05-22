import React from 'react';

import { useEffect } from 'react';

import { useAbortController, useEventListener, useSafeState, useTimers } from '@/hooks/useSafeState';

/**
 * This component demonstrates how to prevent memory leaks in React components.
 * It shows examples of using custom hooks to safely handle:
 * 1. State updates in async operations
 * 2. Fetch requests with AbortController
 * 3. Timers (setTimeout/setInterval)
 * 4. Event listeners
 */
export default function MemoryLeakPreventionExample(): JSX.Element {
  // 1. Safe state updates
  const [data, setData] = useSafeState<string[]>([]);
  const [loading, setLoading] = useSafeState<boolean>(false);
  const [error, setError] = useSafeState<string | null>(null);

  // 2. Abort controller for fetch requests
  const { signal } = useAbortController();

  // 3. Safe timers
  const { setTimeout, setInterval, clearTimeout, clearInterval } = useTimers();

  // 4. Safe event listeners
  const { addEventListener, removeEventListener } = useEventListener();

  // Example of fetching data safely
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Using AbortController signal with fetch
      const response = await fetch('/api/data', { signal });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Safe state update - won't cause memory leak if component unmounts
      setData(result);
    } catch (err) {
      // Don't set error state if the request was aborted
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Example of using safe timers
  useEffect(() => {
    // This timer will be automatically cleared when the component unmounts
    const timer = setTimeout(() => {
      console.log('Timer completed');
      fetchData();
    }, 2000);

    // You can still clear the timer manually if needed
    // clearTimeout(timer);

    // Example of using safe interval
    const _intervalId = setInterval(() => {
      console.log('Interval tick');
    }, 5000);

    // Example of using safe event listeners
    const handleResize = () => {
      console.log('Window resized');
    };

    addEventListener(window, 'resize', handleResize);

    // No need to clean up timers or event listeners manually
    // They will be automatically cleaned up when the component unmounts
  }, [setTimeout, setInterval, addEventListener, fetchData]);

  return (
    <div className="rounded-lg border p-4 shadow-sm">
      <h2 className="mb-4 text-xl font-bold">Memory Leak Prevention Example</h2>
      
      <div className="mb-4">
        <button
          onClick={fetchData}
          className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch Data'}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 rounded bg-red-100 p-3 text-red-700">
          Error: {error}
        </div>
      )}
      
      <div>
        <h3 className="mb-2 font-semibold">Data:</h3>
        {data.length > 0 ? (
          <ul className="list-disc pl-5">
            {data.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No data available</p>
        )}
      </div>
      
      <div className="mt-6 rounded bg-yellow-50 p-3">
        <h3 className="mb-2 font-semibold">How This Prevents Memory Leaks:</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>
            <strong>useSafeState</strong>: Prevents state updates after component unmount
          </li>
          <li>
            <strong>useAbortController</strong>: Cancels fetch requests when component unmounts
          </li>
          <li>
            <strong>useTimers</strong>: Automatically clears timers when component unmounts
          </li>
          <li>
            <strong>useEventListener</strong>: Automatically removes event listeners when component unmounts
          </li>
        </ul>
      </div>
    </div>
  );
}
