import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A custom hook that provides a safe way to update state in components
 * that might be unmounted before an async operation completes.
 * 
 * @param initialState The initial state value
 * @returns A tuple with the current state and a safe setState function
 * 
 * @example
 * ```tsx
 * const [data, setData] = useSafeState<ApiResponse | null>(null);
 * 
 * const fetchData = async () => {
 *   const response = await api.getData();
 *   setData(response); // Safe: won't update state if component is unmounted
 * };
 * ```
 */
export function useSafeState<T>(initialState: T): [T, (value: T | ((prevState: T) => T)) => void] {
  const [state, setState] = useState<T>(initialState);
  const isMounted = useRef<boolean>(true);

  useEffect(() => {
    // Set isMounted to true when the component mounts
    isMounted.current = true;
    
    // Set isMounted to false when the component unmounts
    return () => {
      isMounted.current = false;
    };
  }, []);

  const setSafeState = useCallback((value: T | ((prevState: T) => T)) => {
    // Only update state if the component is still mounted
    if (isMounted.current) {
      setState(value);
    }
  }, []);

  return [state, setSafeState];
}

/**
 * A custom hook that provides an AbortController that is automatically
 * aborted when the component unmounts.
 * 
 * @returns An AbortController with a signal that can be used in fetch requests
 * 
 * @example
 * ```tsx
 * const { signal } = useAbortController();
 * 
 * useEffect(() => {
 *   fetch('/api/data', { signal })
 *     .then(response => response.json())
 *     .then(data => {
 *       // Process data
 *     })
 *     .catch(error => {
 *       if (error.name !== 'AbortError') {
 *         console.error(error);
 *       }
 *     });
 * }, [signal]);
 * ```
 */
export function useAbortController(): { signal: AbortSignal } {
  const abortControllerRef = useRef<AbortController>(new AbortController());
  
  useEffect(() => {
    // Create a new AbortController when the component mounts
    abortControllerRef.current = new AbortController();
    
    // Abort any pending requests when the component unmounts
    return () => {
      abortControllerRef.current.abort();
    };
  }, []);
  
  return { signal: abortControllerRef.current.signal };
}

/**
 * A custom hook that provides a ref to track if a component is mounted.
 * 
 * @returns A ref object with a current property that is true if the component is mounted
 * 
 * @example
 * ```tsx
 * const isMounted = useIsMounted();
 * 
 * const fetchData = async () => {
 *   const response = await api.getData();
 *   if (isMounted.current) {
 *     setData(response);
 *   }
 * };
 * ```
 */
export function useIsMounted(): React.RefObject<boolean> {
  const isMounted = useRef<boolean>(true);
  
  useEffect(() => {
    // Set isMounted to true when the component mounts
    isMounted.current = true;
    
    // Set isMounted to false when the component unmounts
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  return isMounted;
}

/**
 * A custom hook that provides a safe way to use timers in components.
 * The timer is automatically cleared when the component unmounts.
 * 
 * @returns An object with setTimeout and setInterval functions
 * 
 * @example
 * ```tsx
 * const { setTimeout, setInterval } = useTimers();
 * 
 * useEffect(() => {
 *   // This timer will be automatically cleared when the component unmounts
 *   setTimeout(() => {
 *     console.log('This will only run if the component is still mounted');
 *   }, 1000);
 * }, [setTimeout]);
 * ```
 */
export function useTimers() {
  const timersRef = useRef<(number | NodeJS.Timeout)[]>([]);
  
  useEffect(() => {
    // Clear all timers when the component unmounts
    return () => {
      timersRef.current.forEach(timer => {
        clearTimeout(timer as number);
        clearInterval(timer as number);
      });
    };
  }, []);
  
  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(callback, delay);
    timersRef.current.push(timer);
    return timer;
  }, []);
  
  const safeSetInterval = useCallback((callback: () => void, delay: number) => {
    const timer = setInterval(callback, delay);
    timersRef.current.push(timer);
    return timer;
  }, []);
  
  const clearSafeTimeout = useCallback((timer: number | NodeJS.Timeout) => {
    clearTimeout(timer as number);
    timersRef.current = timersRef.current.filter(t => t !== timer);
  }, []);
  
  const clearSafeInterval = useCallback((timer: number | NodeJS.Timeout) => {
    clearInterval(timer as number);
    timersRef.current = timersRef.current.filter(t => t !== timer);
  }, []);
  
  return {
    setTimeout: safeSetTimeout,
    setInterval: safeSetInterval,
    clearTimeout: clearSafeTimeout,
    clearInterval: clearSafeInterval
  };
}

/**
 * A custom hook that provides a safe way to add event listeners in components.
 * The event listeners are automatically removed when the component unmounts.
 * 
 * @returns An object with addEventListener and removeEventListener functions
 * 
 * @example
 * ```tsx
 * const { addEventListener } = useEventListener();
 * 
 * useEffect(() => {
 *   // This event listener will be automatically removed when the component unmounts
 *   addEventListener(window, 'resize', handleResize);
 * }, [addEventListener, handleResize]);
 * ```
 */
export function useEventListener() {
  const listenersRef = useRef<Array<{ target: EventTarget; type: string; listener: EventListenerOrEventListenerObject }>>([]);
  
  useEffect(() => {
    // Remove all event listeners when the component unmounts
    return () => {
      listenersRef.current.forEach(({ target, type, listener }) => {
        target.removeEventListener(type, listener);
      });
    };
  }, []);
  
  const safeAddEventListener = useCallback((
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => {
    target.addEventListener(type, listener, options);
    listenersRef.current.push({ target, type, listener });
  }, []);
  
  const safeRemoveEventListener = useCallback((
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ) => {
    target.removeEventListener(type, listener, options);
    listenersRef.current = listenersRef.current.filter(
      l => !(l.target === target && l.type === type && l.listener === listener)
    );
  }, []);
  
  return {
    addEventListener: safeAddEventListener,
    removeEventListener: safeRemoveEventListener
  };
}
