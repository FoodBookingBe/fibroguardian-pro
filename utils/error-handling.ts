import { redirect } from 'next/navigation';

export function handleClientError(
  error: any, 
  setErrorFunction: (msg: string) => void, 
  defaultMessage = 'Er is een fout opgetreden'
) {
  console.error('Client error:', error);
  setErrorFunction(error?.message || defaultMessage);
}

export function handleServerError(
  error: any, 
  redirectPath?: string,
  defaultMessage = 'server_error' // Default error message for server errors
): Response | undefined { // Return type can be Response for redirects or undefined
  console.error('Server error:', error);
  if (redirectPath) {
    // Note: redirect from next/navigation should be called directly, not returned
    // This function might be better structured to throw a specific error type
    // that a global error handler (e.g., error.tsx) can catch and then redirect.
    // For now, let's assume this is called in a context where redirect is appropriate.
    const errorMessage = error?.message || defaultMessage;
    redirect(`${redirectPath}?error=${encodeURIComponent(errorMessage)}`);
    return; // redirect() will throw an error, so this line might not be reached.
  }
  // If no redirectPath, this function doesn't return a Response.
  // It might throw an error or be used in contexts where a Response isn't expected.
  // Consider what should happen if no redirectPath is provided.
  // Maybe throw the error to be caught by a higher-level error boundary.
  // For now, just logging.
  return undefined; 
}
