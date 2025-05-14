interface ApiErrorResponse {
  status: number;
  error: {
    message: string;
    timestamp: string;
    details?: any; // Optional field for more detailed error info
  };
}

/**
 * Formats an API error response.
 * @param statusCode The HTTP status code.
 * @param message The error message.
 * @param details Optional additional details about the error.
 * @returns A formatted API error object.
 */
export const formatApiError = (
  statusCode: number,
  message: string,
  details?: any
): ApiErrorResponse => {
  return {
    status: statusCode,
    error: {
      message,
      timestamp: new Date().toISOString(),
      ...(details && { details }), // Spread details if provided
    },
  };
};