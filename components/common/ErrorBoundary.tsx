import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/monitoring/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component to catch JavaScript errors anywhere in the child component tree
 * and display a fallback UI instead of crashing the whole app
 * 
 * Features:
 * - Custom fallback UI (component or render function)
 * - Error logging
 * - Optional error callback
 * - Reset on props change option
 * 
 * @example
 * // Basic usage
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * 
 * @example
 * // With custom fallback
 * <ErrorBoundary fallback={<p>Something went wrong</p>}>
 *   <MyComponent />
 * </ErrorBoundary>
 * 
 * @example
 * // With render function fallback
 * <ErrorBoundary 
 *   fallback={(error, errorInfo) => (
 *     <div>
 *       <h2>Something went wrong</h2>
 *       <details>
 *         <summary>Error details</summary>
 *         <p>{error.toString()}</p>
 *         <p>{errorInfo.componentStack}</p>
 *       </details>
 *     </div>
 *   )}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error
    logger.error('Error caught by ErrorBoundary:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      errorInfo
    });

    // Update state with error info
    this.setState({
      errorInfo
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset the error state if props changed and resetOnPropsChange is true
    if (
      this.state.hasError &&
      this.props.resetOnPropsChange &&
      prevProps !== this.props
    ) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    }
  }

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // If a fallback is provided, use it
      if (fallback) {
        // If fallback is a function, call it with the error and errorInfo
        if (typeof fallback === 'function') {
          return fallback(error, errorInfo as ErrorInfo);
        }
        // Otherwise, render the fallback component
        return fallback;
      }

      // Default fallback UI
      return (
        <div className="p-4 border border-red-300 rounded bg-red-50 text-red-800">
          <h2 className="text-lg font-semibold mb-2">Er is iets misgegaan</h2>
          <p className="mb-4">
            Er is een fout opgetreden bij het weergeven van deze component. 
            Probeer de pagina te vernieuwen of neem contact op met ondersteuning als het probleem aanhoudt.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium">Technische details</summary>
              <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
                {error.toString()}
                {errorInfo && errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    // If there's no error, render the children
    return children;
  }
}

/**
 * Higher-order component that wraps a component with an ErrorBoundary
 * 
 * @param Component The component to wrap
 * @param errorBoundaryProps Props for the ErrorBoundary
 * @returns The wrapped component
 * 
 * @example
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   fallback: <p>Something went wrong</p>
 * });
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps: Omit<ErrorBoundaryProps, 'children'> = {}
): React.FC<P> {
  const displayName = Component.displayName || Component.name || 'Component';
  
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;
  
  return WrappedComponent;
}
