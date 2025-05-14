import { memo, FC } from 'react'; // Imported FC for component type

// Custom equality function for complex props
export function arePropsEqual<P extends Record<string, any>>( // Ensure P is an object
  prevProps: Readonly<P>, // Use Readonly for props
  nextProps: Readonly<P>,
  propKeys: (keyof P)[],
  deepEqualityProps: (keyof P)[] = []
): boolean {
  // Check regular props (shallow comparison)
  for (const key of propKeys) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  // Check deep equality props
  for (const key of deepEqualityProps) {
    if (!deepEqual(prevProps[key], nextProps[key])) {
      return false;
    }
  }

  return true;
}

// Deep equality function for objects/arrays
// This is a basic implementation. For more robust deep equality, consider a library.
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (typeof a !== 'object' || a === null || 
      typeof b !== 'object' || b === null) {
    return false;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    // Recursively check nested properties
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

/**
 * A higher-order component that memoizes a component based on specified prop keys.
 * Shallow comparison is used for `propKeys`.
 * Deep comparison is used for `deepEqualityProps`.
 * @param component The component to memoize.
 * @param propKeys Array of prop keys to use for shallow comparison.
 * @param deepEqualityProps Array of prop keys to use for deep comparison.
 * @returns The memoized component.
 */
export function memoWithKeys<P extends Record<string, any>>(
  component: FC<P>, // Use FC type for React functional components
  propKeys: (keyof P)[],
  deepEqualityProps: (keyof P)[] = []
): FC<P> { // Return type should also be FC<P>
  return memo(
    component,
    (prev, next) => arePropsEqual<P>(prev, next, propKeys, deepEqualityProps)
  );
}