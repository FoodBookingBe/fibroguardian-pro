import { useState, useEffect, Dispatch, SetStateAction } from 'react'; // Added Dispatch, SetStateAction

/**
 * Hook om state in localStorage op te slaan en te synchroniseren tussen tabs/windows.
 * @param key De localStorage key.
 * @param initialValue De initiële waarde of een functie die de initiële waarde retourneert.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, Dispatch<SetStateAction<T>>] {
  // State om de waarde bij te houden
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      // Als initialValue een functie is, roep het aan, anders gebruik de waarde direct
      return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : (typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue);
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error); // Use warn for non-critical errors
      return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
    }
  });
  
  // Wrapped setter die waarde naar localStorage persist.
  const setValue: Dispatch<SetStateAction<T>> = (value: unknown) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        // Dispatch a custom event to notify other tabs/windows immediately
        window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(valueToStore) }));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  };
  
  // Luister naar storage events om state te synchroniseren tussen tabs/windows.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue) as T);
        } catch (error) {
          console.warn(`Error parsing storage event value for key “${key}”:`, error);
        }
      } else if (event.key === key && event.newValue === null) { // Handle item removal
        setStoredValue(typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup listener
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]); // initialValue in deps to re-evaluate if it changes (though typically it shouldn't for a key)
  
  return [storedValue, setValue];
}