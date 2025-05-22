import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { Database } from '@/types/database'; // Zorg dat dit pad correct is

type SupabaseQueryFunction<TQueryFnData, TError> = (
  supabase: ReturnType<typeof getSupabaseBrowserClient>
) => Promise<TQueryFnData>;

export interface ErrorMessage { // Voeg 'export' toe
  message: string;
  details?: string;
  code?: string;
}

interface SupabaseQueryHookOptions<TQueryFnData, TError, TData, TQueryKey extends QueryKey> extends UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> {
  // Geen extra properties nodig, UseQueryOptions definieert queryKey al correct
}

/**
 * Custom hook for fetching data from Supabase with React Query.
 * Automatically handles Supabase client initialization and error formatting.
 *
 * @param queryKey - The React Query key for this query.
 * @param queryFn - An async function that receives the Supabase client and returns the data.
 * @param options - React Query options.
 * @returns The result of the useQuery hook.
 */
function useSupabaseQuery<
  TQueryFnData = unknown,
  TError = ErrorMessage,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  queryKey: TQueryKey,
  queryFn: SupabaseQueryFunction<TQueryFnData, TError>,
  options?: SupabaseQueryHookOptions<TQueryFnData, TError, TData, TQueryKey>
) {
  return useQuery<TQueryFnData, TError, TData, TQueryKey>({
    queryKey,
    queryFn: async () => {
      // Initialiseer Supabase client alleen aan de client-side
      if (typeof window === 'undefined') {
        // Dit zou niet moeten gebeuren als de 'enabled' optie correct wordt gebruikt,
        // maar als een fallback, retourneer een lege belofte of gooi een fout.
        // Voor nu, gooi een fout om het probleem te benadrukken.
        throw new Error("Supabase client cannot be initialized on the server side within useSupabaseQuery.");
      }
      const supabase = getSupabaseBrowserClient();
      try {
        // Roep de doorgegeven queryFn aan met de Supabase client
        const result = await queryFn(supabase);
        return result;
      } catch (error: unknown) {
        // Formatteer Supabase errors of andere errors
        const errorMessage: ErrorMessage = {
          message: error.message || 'An unknown error occurred',
          details: error.details || error.hint || undefined,
          code: error.code || undefined,
        };
        throw errorMessage;
      }
    },
    ...options,
  });
}

export default useSupabaseQuery;

// Aangepaste hook voor het ophalen van een gebruikersprofiel
export function useProfile(userId: string | undefined, options?: UseQueryOptions<any, ErrorMessage>) {
  return useSupabaseQuery<any, ErrorMessage>(
    ['profile', userId],
    async (supabase) => {
      if (!userId) {
        throw new Error('User ID is required to fetch profile.');
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }
      return data;
    },
    {
      enabled: !!userId, // Query alleen uitvoeren als userId aanwezig is
      ...options,
    }
  );
}
