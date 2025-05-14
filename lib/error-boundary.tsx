'use client'; // This component must be a Client Component

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { usePathname } from 'next/navigation'; // useRouter is not needed here

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode; // Optional custom fallback UI
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null; // Store the component stack
  // pathname: string; // Store pathname to detect route changes
}

// This is the actual class component that acts as the Error Boundary
class ErrorBoundaryInternal extends Component<ErrorBoundaryProps & { pathname: string }, ErrorBoundaryState> {
  public state: ErrorBoundaryState; // Explicitly declare state as a public property

  constructor(props: ErrorBoundaryProps & { pathname: string }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    // Example: Sentry.captureException(error, { extra: errorInfo });
    this.setState({ errorInfo });
  }
  
  // Reset error state if the route changes
  componentDidUpdate(prevProps: Readonly<ErrorBoundaryProps & { pathname: string }>) {
    if (this.props.pathname !== prevProps.pathname && this.state.hasError) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div role="alert" className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 text-center">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex flex-col items-center text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <h2 className="mt-3 text-xl sm:text-2xl font-semibold">Er is iets misgegaan</h2>
            </div>
            
            <p className="text-gray-600 text-sm sm:text-base mb-6">
              Onze excuses, er heeft zich een onverwachte fout voorgedaan. 
              Probeer de pagina te vernieuwen of ga terug naar het dashboard.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2.5 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
              >
                Pagina Vernieuwen
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'} // Simple redirect
                className="w-full py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
              >
                Naar Dashboard
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 p-3 bg-gray-50 rounded-md text-left overflow-auto max-h-48">
                <p className="text-xs font-mono text-red-700 mb-1">
                  <strong>Fout:</strong> {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800">Component Stack</summary>
                    <pre className="mt-1 font-mono text-gray-600 whitespace-pre-wrap bg-gray-100 p-2 rounded">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Wrapper component to allow using Next.js hooks (like usePathname)
// and then passing the value to the class component.
export default function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const pathname = usePathname();
  return (
    <ErrorBoundaryInternal pathname={pathname} fallback={fallback} children={children}>
      {/* Children are passed via props to ErrorBoundaryInternal, no need to nest them here again */}
    </ErrorBoundaryInternal>
  );
}