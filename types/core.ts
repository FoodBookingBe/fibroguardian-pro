// Basis API response types
export interface ErrorResponse {
  message: string;
  code?: string | number; // Optional error code (e.g., HTTP status or custom code)
  details?: unknown; // Optional additional details, changed any to unknown
}
 
// export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse; // Union type (Removed as unused)
 
// Utility types
// export type WithId<T> = T & { id: string }; // Ensures an object has an id string (Removed as unused)
 
// FormState can be more complex, often mapping model types to string/boolean for form inputs
// This is a generic placeholder; specific forms might need more tailored state types.
// export type FormState<TModel> = {
//   [K in keyof TModel]?: TModel[K] extends Date
//     ? string // Dates often become strings in forms
//     : TModel[K] extends number | undefined
//     ? string // Numbers often become strings in forms (or allow number for controlled number inputs)
//     : TModel[K] extends any[] | undefined
//     ? TModel[K] // Keep arrays as they are
//     : string | boolean | number; // Default for other types (adjust as needed)
// } & { generalError?: string }; // (Removed as unused)
 
 
// Null handling utility types
// export type Nullable<T> = T | null; // (Removed as unused)
 
// Type guards (removed unused isErrorResponse, isSuccessResponse, isNonNullable)
 
// Example of a more specific error type that might be thrown by hooks/API calls
// This aligns with the ErrorMessage interface already in lib/error-handler.ts
// Consider merging or ensuring compatibility.
export interface AppError extends Error {
  userMessage: string;
  technicalMessage?: string;
  errorCode?: string;
  action?: string;
  httpStatus?: number;
}

export class CustomError extends Error implements AppError {
  userMessage: string;
  technicalMessage?: string;
  errorCode?: string;
  action?: string;
  httpStatus?: number;

  constructor({
    name = 'CustomError',
    message, // This will be the technical message from Error class
    userMessage,
    technicalMessage,
    errorCode,
    action,
    httpStatus,
  }: Partial<AppError> & { message: string; userMessage: string }) {
    super(message);
    this.name = name;
    this.userMessage = userMessage;
    this.technicalMessage = technicalMessage || message;
    this.errorCode = errorCode;
    this.action = action;
    this.httpStatus = httpStatus;
    Object.setPrototypeOf(this, CustomError.prototype); // For instanceof to work correctly
  }
}
