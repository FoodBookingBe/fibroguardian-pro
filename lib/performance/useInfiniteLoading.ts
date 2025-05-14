import { useState, useCallback, useRef, useEffect, DependencyList } from 'react';

interface UseInfiniteLoadingOptions<T> {
  initialData?: T[];
  fetchFn: (page: number, limit: number) => Promise<T[]>; // Function to fetch a page of data
  limit?: number; // Number of items per page
  hasMoreInitial?: boolean; // Initial state for hasMore
  threshold?: number; // IntersectionObserver threshold
  rootMargin?: string; // IntersectionObserver rootMargin
  dependencies?: DependencyList; // Additional dependencies for re-fetching/resetting
}

/**
 * Custom hook voor oneindige scroll/lazy loading van gegevens.
 */
export function useInfiniteLoading<T>({
  initialData = [],
  fetchFn,
  limit = 10,
  hasMoreInitial = true,
  threshold = 0.1,
  rootMargin = '200px',
  dependencies = []
}: UseInfiniteLoadingOptions<T>) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(hasMoreInitial);
  const [page, setPage] = useState<number>(1); // Current page number to fetch
  
  const observer = useRef<IntersectionObserver | null>(null);

  // Function to load more data
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const newItems = await fetchFn(page, limit);
      
      if (newItems.length === 0 || newItems.length < limit) {
        setHasMore(false);
      }
      
      setData(prev => [...prev, ...newItems]);
      setPage(prev => prev + 1);
    } catch (err) {
      console.error('Error loading more items in useInfiniteLoading:', err);
      setError(err instanceof Error ? err : new Error('Fout bij het laden van meer gegevens.'));
      // Optionally set hasMore to false on error to prevent further attempts
      // setHasMore(false); 
    } finally {
      setLoading(false);
    }
  }, [fetchFn, page, limit, loading, hasMore]); // Added dependencies

  // IntersectionObserver setup for the last element
  const lastElementRef = useCallback((node: Element | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect(); // Disconnect previous observer
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    }, { threshold, rootMargin });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadMore, threshold, rootMargin]); // Added dependencies
  
  // Reset all state, e.g., when filters change
  const reset = useCallback(() => {
    setData(initialData); // Or just [] if initialData shouldn't persist on reset
    setPage(1);
    setLoading(false);
    setError(null);
    setHasMore(hasMoreInitial);
  }, [initialData, hasMoreInitial]);

  // Effect to reset when external dependencies change
  useEffect(() => {
    reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
  
  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);
  
  return {
    data,
    loading,
    error,
    hasMore,
    loadMore, // Expose loadMore if manual trigger is needed
    lastElementRef,
    reset,
    page // Expose current page if needed
  };
}