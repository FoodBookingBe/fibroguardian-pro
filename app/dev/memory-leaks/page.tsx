import React from 'react';

import { Metadata } from 'next';

import MemoryLeakPreventionExample from '@/components/examples/MemoryLeakPreventionExample';

export const metadata: Metadata = {
  title: 'Memory Leak Prevention | FibroGuardian Pro',
  description: 'Examples and best practices for preventing memory leaks in React components',
};

/**
 * This page demonstrates memory leak prevention techniques in React components.
 * It includes examples of how to properly clean up resources when components unmount.
 */
export default function MemoryLeakPreventionPage(): JSX.Element {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Memory Leak Prevention</h1>
        <p className="text-gray-600">
          This page demonstrates techniques for preventing memory leaks in React components.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Common Memory Leak Sources</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-medium text-blue-600">useEffect Cleanup</h3>
            <p className="text-sm">
              Missing cleanup functions in useEffect hooks can cause memory leaks when components unmount.
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-medium text-blue-600">Event Listeners</h3>
            <p className="text-sm">
              Event listeners added to the window or document must be removed when components unmount.
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-medium text-blue-600">Async Operations</h3>
            <p className="text-sm">
              State updates from async operations after component unmount can cause memory leaks.
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-medium text-blue-600">Timers</h3>
            <p className="text-sm">
              setTimeout and setInterval must be cleared when components unmount to prevent memory leaks.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Example Component</h2>
        <p className="mb-4 text-gray-600">
          This example demonstrates how to use custom hooks to prevent memory leaks in React components.
        </p>
        <MemoryLeakPreventionExample />
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Custom Hooks</h2>
        <p className="mb-4 text-gray-600">
          We&apos;ve created several custom hooks to help prevent memory leaks:
        </p>
        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-medium text-blue-600">useSafeState</h3>
            <p className="mb-2 text-sm">
              A hook that provides a safe way to update state in components that might be unmounted before an async operation completes.
            </p>
            <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-xs">
              <code>{`const [data, setData] = useSafeState(initialState);

// Safe to use in async functions
const fetchData = async () => {
  const result = await api.getData();
  setData(result); // Won't cause memory leak if unmounted
};`}</code>
            </pre>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-medium text-blue-600">useAbortController</h3>
            <p className="mb-2 text-sm">
              A hook that provides an AbortController that is automatically aborted when the component unmounts.
            </p>
            <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-xs">
              <code>{`const { signal } = useAbortController();

useEffect(() => {
  fetch('/api/data', { signal })
    .then(response => response.json())
    .then(data => {
      // Process data
    });
  // No need to abort manually
}, [signal]);`}</code>
            </pre>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-medium text-blue-600">useTimers</h3>
            <p className="mb-2 text-sm">
              A hook that provides safe versions of setTimeout and setInterval that are automatically cleared when the component unmounts.
            </p>
            <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-xs">
              <code>{`const { setTimeout, setInterval } = useTimers();

useEffect(() => {
  setTimeout(() => {
    console.log('This will be cleared automatically');
  }, 1000);
  
  setInterval(() => {
    console.log('This will also be cleared automatically');
  }, 5000);
  // No need for cleanup
}, [setTimeout, setInterval]);`}</code>
            </pre>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-medium text-blue-600">useEventListener</h3>
            <p className="mb-2 text-sm">
              A hook that provides a safe way to add event listeners that are automatically removed when the component unmounts.
            </p>
            <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-xs">
              <code>{`const { addEventListener } = useEventListener();

useEffect(() => {
  addEventListener(window, 'resize', handleResize);
  // No need to remove event listener manually
}, [addEventListener, handleResize]);`}</code>
            </pre>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-yellow-50 p-4">
        <h2 className="mb-2 text-xl font-semibold">Memory Leak Detection</h2>
        <p className="mb-4">
          We&apos;ve also created a script to detect potential memory leaks in the codebase:
        </p>
        <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-xs">
          <code>npm run check:memory-leaks</code>
        </pre>
        <p className="mt-2 text-sm text-gray-600">
          This script analyzes all components and containers for potential memory leaks and generates a report with recommendations.
        </p>
      </div>
    </div>
  );
}
