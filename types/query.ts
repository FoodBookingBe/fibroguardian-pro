import { QueryKey, UseQueryOptions, UseQueryResult } from '@tanstack/react-query'; // UseMutationOptions removed

import { ErrorResponse } from './core'; // Using ErrorResponse from core types

// Consistent return type for query hooks
// Includes all properties from UseQueryResult for full functionality
export type QueryHookResult<TData, TError = ErrorResponse> = UseQueryResult<TData, TError>;

// Specific type for Supabase query functions used within useSupabaseQuery
// Ensures the queryFn returns TData or throws an error compatible with TError
export type SupabaseQueryFunction<TData, TError = ErrorResponse> = () => Promise<TData>;

// Type for options passed to the generic useSupabaseQuery hook
export type SupabaseQueryHookOptions<
  TQueryFnData = unknown, // Data type returned by queryFn
  TError = ErrorResponse,       // Error type
  TData = TQueryFnData,   // Data type returned by useQuery (after select, etc.)
  TQueryKey extends QueryKey = QueryKey // Type of the query key
> = Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>;
