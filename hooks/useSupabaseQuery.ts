import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';

import { getSupabaseBrowserClient } from '@/lib/supabase-client';

type SupabaseQueryFunction<TQueryFnData, TError> = (
  supabase: ReturnType<typeof getSupabaseBrowserClient>
) => Promise<TQueryFnData>;

export interface ErrorMessage { // Voeg 'export' toe
  message: string;
  details?: string;
  code?: string;
}

interface SupabaseQueryHookOptions<TQueryFnData, TError, TData, TQueryKey extends QueryKey> extends Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey'> {
  // queryKey wordt apart doorgegeven aan useSupabaseQuery
  supabaseOptions?: {
    schema?: string;
    headers?: Record<string, string>;
  };
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
          message: (error as Record<string, unknown>)?.message as string || 'An unknown error occurred',
          details: (error as Record<string, unknown>)?.details as string || (error as Record<string, unknown>)?.hint as string || undefined,
          code: (error as Record<string, unknown>)?.code as string || undefined,
        };
        throw errorMessage;
      }
    },
    ...options,
  });
}

export default useSupabaseQuery;

// Aangepaste hook voor het ophalen van een gebruikersprofiel
export interface Profile {
  id: string;
  voornaam: string;
  achternaam: string;
  type: 'patient' | 'specialist' | 'admin';
  avatar_url?: string;
  geboortedatum?: string;
}

export function useProfile(userId: string | undefined, options?: Omit<UseQueryOptions<Profile, ErrorMessage, Profile, readonly unknown[]>, 'queryKey'>) {
  return useSupabaseQuery<Profile, ErrorMessage>(
    ['profile', userId],
    async (supabase: any) => {
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

// Additional hooks for missing exports
export function useTasks(userId: string | undefined, filters?: { type?: string; pattern?: string }, options?: any) {
  return useSupabaseQuery(
    ['tasks', userId, filters],
    async (supabase: any) => {
      if (!userId) {
        throw new Error('User ID is required to fetch tasks.');
      }

      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.pattern) {
        query = query.eq('herhaal_patroon', filters.pattern);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    {
      enabled: !!userId,
      ...options,
    }
  );
}

export function useTask(taskId: string | undefined, options?: any) {
  return useSupabaseQuery(
    ['task', taskId],
    async (supabase: any) => {
      if (!taskId) {
        throw new Error('Task ID is required to fetch task.');
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) throw error;
      return data;
    },
    {
      enabled: !!taskId,
      ...options,
    }
  );
}

export function useTaskLogs(userId: string | undefined, limit = 50, options?: any) {
  return useSupabaseQuery(
    ['taskLogs', userId, limit],
    async (supabase: any) => {
      if (!userId) {
        throw new Error('User ID is required to fetch task logs.');
      }

      const { data, error } = await supabase
        .from('task_logs')
        .select('*, tasks(titel, type)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    {
      enabled: !!userId,
      ...options,
    }
  );
}

export function useRecentLogs(userId: string | undefined, limit = 10, options?: any) {
  return useSupabaseQuery(
    ['recentLogs', userId, limit],
    async (supabase: any) => {
      if (!userId) {
        throw new Error('User ID is required to fetch recent logs.');
      }

      const { data, error } = await supabase
        .from('task_logs')
        .select('*, tasks(titel)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    {
      enabled: !!userId,
      ...options,
    }
  );
}

export function useReflecties(userId: string | undefined, limit = 10, options?: any) {
  return useSupabaseQuery(
    ['reflecties', userId, limit],
    async (supabase: any) => {
      if (!userId) {
        throw new Error('User ID is required to fetch reflecties.');
      }

      const { data, error } = await supabase
        .from('reflecties')
        .select('*')
        .eq('user_id', userId)
        .order('datum', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    {
      enabled: !!userId,
      ...options,
    }
  );
}

export function useInsights(userId: string | undefined, limit = 5, options?: any) {
  return useSupabaseQuery(
    ['insights', userId, limit],
    async (supabase: any) => {
      if (!userId) {
        throw new Error('User ID is required to fetch insights.');
      }

      const { data, error } = await supabase
        .from('inzichten')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    {
      enabled: !!userId,
      ...options,
    }
  );
}

// Interface for specialist with relation data
export interface SpecialistWithRelation {
  id: string;
  relationId: string; // ID of the specialist_patienten relation
  voornaam: string;
  achternaam: string;
  avatar_url?: string;
  type: 'patient' | 'specialist' | 'admin';
  email?: string;
  toegangsrechten?: string[];
  // Additional Profile properties to make it compatible
  postcode?: string;
  gemeente?: string;
  geboortedatum?: Date;
  created_at: Date;
  updated_at: Date;
}

export function useMySpecialists(patientId: string | undefined, options?: any) {
  return useSupabaseQuery(
    ['mySpecialists', patientId],
    async (supabase: any) => {
      if (!patientId) {
        throw new Error('Patient ID is required to fetch specialists.');
      }

      const { data, error } = await supabase
        .from('specialist_patienten')
        .select(`
          id,
          specialist_id,
          toegangsrechten,
          profiles!specialist_patienten_specialist_id_fkey (
            id,
            voornaam,
            achternaam,
            avatar_url,
            type,
            email,
            postcode,
            gemeente,
            geboortedatum,
            created_at,
            updated_at
          )
        `)
        .eq('patient_id', patientId);

      if (error) throw error;

      // Transform the data to match SpecialistWithRelation interface
      return data.map((relation: any) => ({
        id: relation.profiles.id,
        relationId: relation.id,
        voornaam: relation.profiles.voornaam,
        achternaam: relation.profiles.achternaam,
        avatar_url: relation.profiles.avatar_url,
        type: relation.profiles.type,
        email: relation.profiles.email,
        toegangsrechten: relation.toegangsrechten || [],
        // Additional Profile properties with defaults
        postcode: relation.profiles.postcode,
        gemeente: relation.profiles.gemeente,
        geboortedatum: relation.profiles.geboortedatum,
        created_at: new Date(relation.profiles.created_at || Date.now()),
        updated_at: new Date(relation.profiles.updated_at || Date.now()),
      }));
    },
    {
      enabled: !!patientId,
      ...options,
    }
  );
}

// Export types for reuse
export type RecentLogWithTaskTitle = any; // Define this properly based on your needs
