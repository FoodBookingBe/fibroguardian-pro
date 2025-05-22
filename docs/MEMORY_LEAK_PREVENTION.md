# Memory Leak Prevention Guide

This document provides guidance on preventing memory leaks in the FibroGuardian Pro application, particularly in React components.

## Table of Contents

1. [Overview](#overview)
2. [Common Memory Leak Patterns](#common-memory-leak-patterns)
3. [Best Practices](#best-practices)
4. [Fixing Memory Leaks](#fixing-memory-leaks)
5. [Testing for Memory Leaks](#testing-for-memory-leaks)

## Overview

Memory leaks in React applications can lead to degraded performance, increased memory usage, and eventually crashes. They typically occur when a component is unmounted but some of its code continues to run or hold references to objects.

The most common causes of memory leaks in React applications are:

1. **Uncleared event listeners**
2. **Missing cleanup in useEffect hooks**
3. **State updates after component unmount**
4. **Uncleared timers (setTimeout/setInterval)**
5. **Circular references in state or props**

## Common Memory Leak Patterns

### 1. Missing Cleanup in useEffect

When you add event listeners, subscriptions, or other side effects in a `useEffect` hook, you must return a cleanup function to remove them when the component unmounts.

```jsx
// ❌ Bad: No cleanup function
useEffect(() => {
  window.addEventListener('resize', handleResize);
}, []);

// ✅ Good: With cleanup function
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

### 2. State Updates After Component Unmount

When you have asynchronous operations that update state, they might complete after the component has unmounted, causing memory leaks.

```jsx
// ❌ Bad: No check if component is still mounted
useEffect(() => {
  fetchData().then(data => {
    setData(data); // This might run after unmount
  });
}, []);

// ✅ Good: Check if component is still mounted
useEffect(() => {
  const isMounted = { current: true };
  fetchData().then(data => {
    if (isMounted.current) {
      setData(data);
    }
  });
  return () => {
    isMounted.current = false;
  };
}, []);
```

### 3. Uncleared Timers

Timers created with `setTimeout` or `setInterval` must be cleared when the component unmounts.

```jsx
// ❌ Bad: Timer not cleared
useEffect(() => {
  const timer = setTimeout(callback, 1000);
}, []);

// ✅ Good: Timer cleared in cleanup
useEffect(() => {
  const timer = setTimeout(callback, 1000);
  return () => {
    clearTimeout(timer);
  };
}, []);
```

### 4. Circular References

Circular references can prevent garbage collection and cause memory leaks.

```jsx
// ❌ Bad: Circular reference
const [state, setState] = useState({});
useEffect(() => {
  const obj = { parent: null };
  obj.parent = obj; // Circular reference
  setState(obj);
}, []);

// ✅ Good: Avoid circular references
const [state, setState] = useState({});
useEffect(() => {
  const child = { name: 'child' };
  const parent = { name: 'parent', child };
  setState(parent);
}, []);
```

## Best Practices

### 1. Use a Mounted Ref

Create a ref to track if the component is mounted, and check it before updating state in async operations:

```jsx
function MyComponent() {
  const isMounted = useRef(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Set to false when component unmounts
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = async () => {
    const result = await api.getData();
    if (isMounted.current) {
      setData(result);
    }
  };

  return <div>{/* Component JSX */}</div>;
}
```

### 2. Create Custom Hooks for Common Patterns

Create reusable hooks for common patterns to ensure consistent cleanup:

```jsx
// Custom hook for safe async state updates
function useSafeState(initialState) {
  const isMounted = useRef(true);
  const [state, setState] = useState(initialState);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const setSafeState = useCallback(
    (data) => {
      if (isMounted.current) {
        setState(data);
      }
    },
    []
  );

  return [state, setSafeState];
}
```

### 3. Use AbortController for Fetch Requests

For fetch requests, use AbortController to cancel pending requests when the component unmounts:

```jsx
useEffect(() => {
  const abortController = new AbortController();
  const signal = abortController.signal;

  fetch('/api/data', { signal })
    .then(response => response.json())
    .then(data => {
      if (!signal.aborted) {
        setData(data);
      }
    })
    .catch(error => {
      if (error.name !== 'AbortError') {
        console.error(error);
      }
    });

  return () => {
    abortController.abort();
  };
}, []);
```

### 4. Properly Clean Up Event Listeners

Always remove event listeners in the cleanup function:

```jsx
useEffect(() => {
  const handleResize = () => {
    // Handle resize event
  };

  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

### 5. Clear Timers

Always clear timers in the cleanup function:

```jsx
useEffect(() => {
  const timerId = setInterval(() => {
    // Do something periodically
  }, 1000);

  return () => {
    clearInterval(timerId);
  };
}, []);
```

## Fixing Memory Leaks

To fix memory leaks in the FibroGuardian Pro application, follow these steps:

### 1. Run the Memory Leak Detection Script

```bash
npm run check:memory-leaks
```

This will generate a report in `reports/memory-leak-report.md` with a list of potential memory leaks.

### 2. Fix Missing Cleanup in useEffect

For each component with missing cleanup in useEffect, add a cleanup function:

```jsx
// Before
useEffect(() => {
  // Effect code
}, [dependencies]);

// After
useEffect(() => {
  // Effect code
  return () => {
    // Cleanup code
  };
}, [dependencies]);
```

### 3. Fix State Updates After Component Unmount

For each component with state updates in async functions, add a mounted ref:

```jsx
// Add at the top of the component
const isMounted = useRef(true);

// Add cleanup in useEffect
useEffect(() => {
  return () => {
    isMounted.current = false;
  };
}, []);

// Check before updating state
const fetchData = async () => {
  const result = await api.getData();
  if (isMounted.current) {
    setState(result);
  }
};
```

### 4. Fix Uncleared Timers

For each component with uncleared timers, add cleanup:

```jsx
// Before
useEffect(() => {
  const timerId = setTimeout(callback, 1000);
}, []);

// After
useEffect(() => {
  const timerId = setTimeout(callback, 1000);
  return () => {
    clearTimeout(timerId);
  };
}, []);
```

### 5. Fix Event Listeners

For each component with event listeners, ensure they are removed:

```jsx
// Before
useEffect(() => {
  window.addEventListener('resize', handleResize);
}, []);

// After
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

## Testing for Memory Leaks

### 1. Manual Testing

1. Open the application in Chrome
2. Open Chrome DevTools
3. Go to the Memory tab
4. Take a heap snapshot
5. Perform actions that mount and unmount components
6. Take another heap snapshot
7. Compare snapshots to identify retained objects

### 2. Automated Testing

Use the memory leak detection script regularly:

```bash
npm run check:memory-leaks
```

### 3. Performance Monitoring

Monitor memory usage in production using tools like:

- [web-vitals](https://www.npmjs.com/package/web-vitals)
- [Sentry](https://sentry.io/)
- [New Relic](https://newrelic.com/)

## Conclusion

By following these best practices and fixing the identified memory leaks, you can ensure that FibroGuardian Pro performs optimally and provides a smooth user experience.

Remember to run the memory leak detection script regularly as part of your development workflow to catch and fix memory leaks early.
