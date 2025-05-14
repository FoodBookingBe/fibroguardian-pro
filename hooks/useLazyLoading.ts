import { useState, useEffect, DependencyList } from 'react'; // Added DependencyList

// Hook voor lazy loading van componenten of data
export function useLazyLoading<T>(
  loadingFn: () => Promise<T>,
  dependencies: DependencyList = [], // Use DependencyList type
  initialState: T | null = null
) {
  const [data, setData] = useState<T | null>(initialState);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    loadingFn()
      .then(result => {
        if (isMounted) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error('Error in lazy loading hook:', err); // More specific console error
          setError(err instanceof Error ? err : new Error(String(err.message || err))); // Better error object creation
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies); // Spread dependencies array

  return { data, loading, error };
}