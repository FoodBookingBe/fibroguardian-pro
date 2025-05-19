import { useQuery, QueryKey } from '@tanstack/react-query'; // Removed UseQueryResult
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { handleSupabaseError, ErrorMessage } from '@/lib/error-handler';
import { Task, Profile, TaskLog, Reflectie, Inzicht } from '@/types'; // Removed SpecialistPatient
import { QueryHookResult, SupabaseQueryHookOptions, SupabaseQueryFunction } from '@/types/query'; 
import { STALE_TIME } from '@/lib/QueryClientConfig'; 

// Define SpecialistWithRelation type here or import from types/index.ts if moved
export interface SpecialistWithRelation extends Profile {
  relationId: string; 
}
// Define PatientWithRelation type here or import from types/index.ts if moved
export interface PatientWithRelation extends Profile {
  relationId: string;
}

// Generic useSupabaseQuery hook
export function useSupabaseQuery<
  TQueryFnData, 
  TError = ErrorMessage, 
  TData = TQueryFnData, 
  TQueryKey extends QueryKey = QueryKey 
>(
  queryKey: TQueryKey,
  queryFn: SupabaseQueryFunction<TQueryFnData, TError>, 
  options?: SupabaseQueryHookOptions<TQueryFnData, TError, TData, TQueryKey>
): QueryHookResult<TData, TError> { 
  return useQuery<TQueryFnData, TError, TData, TQueryKey>({
    queryKey,
    queryFn,
    ...options,
  });
}

/**
 * Hook to fetch a user's profile data.
 */
export function useProfile(
  userId: string | null | undefined,
  options?: SupabaseQueryHookOptions<Profile | null, ErrorMessage, Profile | null>
): QueryHookResult<Profile | null, ErrorMessage> {
  return useSupabaseQuery<Profile | null, ErrorMessage, Profile | null>(
    ['profile', userId],
    async () => {
      if (!userId) return null;
      const supabase = getSupabaseBrowserClient();
      
      try {
        // First try to get the profile directly from the profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (profileData) {
          return profileData as Profile;
        }
        
        // If that fails, try the RPC method as fallback
        if (profileError) {
          console.log(`Direct profile fetch failed for user ${userId}, trying RPC fallback`);
          const { data, error } = await supabase
            .rpc('get_profile_for_owner', { owner_user_id: userId });

          if (error) {
            // Check for PGRST116 specifically, which means "0 rows"
            if (error.code === 'PGRST116') {
              console.log(`No profile found for user ${userId}`);
              return null; // No profile found, not necessarily an "error" to throw
            }
            throw handleSupabaseError(error, 'profile-fetch');
          }
          
          // Data from RPC returning SETOF is an array.
          // If a profile is found, it will be the first (and only) element.
          const profile = (data && data.length > 0 ? data[0] : null);
          return profile as Profile | null;
        }
        
        return null; // Should not reach here, but added for completeness
      } catch (err) {
        console.error(`Error in useProfile hook for user ${userId}:`, err);
        throw handleSupabaseError(err as any, 'profile-fetch');
      }
    },
    {
      enabled: !!userId,
      staleTime: STALE_TIME.PROFILES, // Corrected typo: staleTime -> STALE_TIME
      ...options,
    }
  );
}

// Hook voor taken
export function useTasks(
  userId: string | undefined, 
  filters?: { type?: string; pattern?: string },
  options?: SupabaseQueryHookOptions<Task[], ErrorMessage, Task[]>
): QueryHookResult<Task[], ErrorMessage> {
  return useSupabaseQuery<Task[], ErrorMessage, Task[]>(
    ['tasks', userId, ...(filters ? [JSON.stringify(filters)] : [])],
    async () => {
      if (!userId) return [];
      const supabase = getSupabaseBrowserClient();
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId);
      
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.pattern) {
        query = query.eq('herhaal_patroon', filters.pattern);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw handleSupabaseError(error, 'tasks-fetch');
      return (data || []) as Task[];
    },
    {
      enabled: !!userId,
      staleTime: STALE_TIME.TASKS,
      ...options,
    }
  );
}

export function useTask(
  taskId: string | null | undefined,
  options?: SupabaseQueryHookOptions<Task | null, ErrorMessage, Task | null>
): QueryHookResult<Task | null, ErrorMessage> {
  return useSupabaseQuery<Task | null, ErrorMessage, Task | null>(
    ['task', taskId],
    async () => {
      if (!taskId) return null;
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('tasks')
        .select<string, Task>('*')
        .eq('id', taskId)
        .single();
      if (error) throw handleSupabaseError(error, `task-fetch-${taskId}`);
      return data;
    },
    {
      enabled: !!taskId,
      staleTime: STALE_TIME.TASKS,
      ...options,
    }
  );
}

export type RecentLogWithTaskTitle = TaskLog & { tasks: { titel: string; type: string } | null }; 

export function useTaskLogs(
  taskId: string | undefined,
  options?: SupabaseQueryHookOptions<RecentLogWithTaskTitle[], ErrorMessage, RecentLogWithTaskTitle[]>
): QueryHookResult<RecentLogWithTaskTitle[], ErrorMessage> {
  return useSupabaseQuery<RecentLogWithTaskTitle[], ErrorMessage, RecentLogWithTaskTitle[]>(
    ['taskLogs', taskId],
    async () => {
      if (!taskId) return [];
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('task_logs')
        .select<'*, tasks(titel, type)', RecentLogWithTaskTitle>('*, tasks(titel, type)')
        .eq('task_id', taskId)
        .order('start_tijd', { ascending: false });
      if (error) throw handleSupabaseError(error, `tasklogs-fetch-${taskId}`);
      return (data || []) as RecentLogWithTaskTitle[];
    },
    {
      enabled: !!taskId,
      staleTime: STALE_TIME.TASK_LOGS,
      ...options,
    }
  );
}

export function useRecentLogs(
  userId: string | undefined, 
  limit: number = 10,
  options?: SupabaseQueryHookOptions<RecentLogWithTaskTitle[], ErrorMessage, RecentLogWithTaskTitle[]>
): QueryHookResult<RecentLogWithTaskTitle[], ErrorMessage> {
  return useSupabaseQuery<RecentLogWithTaskTitle[], ErrorMessage, RecentLogWithTaskTitle[]>(
    ['recentLogs', userId, limit],
    async () => {
      if (!userId) return [];
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('task_logs')
        .select<'*, tasks(titel, type)', RecentLogWithTaskTitle>('*, tasks(titel, type)')
        .eq('user_id', userId)
        .order('start_tijd', { ascending: false })
        .limit(limit);
      if (error) throw handleSupabaseError(error, `recentlogs-fetch-${userId}`);
      return (data || []) as RecentLogWithTaskTitle[];
    },
    {
      enabled: !!userId,
      staleTime: STALE_TIME.TASK_LOGS,
      ...options,
    }
  );
}

export function useInsights(
  userId: string | undefined,
  limit: number = 3,
  options?: SupabaseQueryHookOptions<Inzicht[], ErrorMessage, Inzicht[]>
): QueryHookResult<Inzicht[], ErrorMessage> {
  return useSupabaseQuery<Inzicht[], ErrorMessage, Inzicht[]>(
    ['insights', userId, limit],
    async () => {
      if (!userId) return [];
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('inzichten')
        .select<string, Inzicht>('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw handleSupabaseError(error, `insights-fetch-${userId}`);
      return (data || []) as Inzicht[];
    },
    {
      enabled: !!userId,
      staleTime: STALE_TIME.INSIGHTS,
      ...options,
    }
  );
}

export function useReflecties(
  userId: string | undefined,
  limit: number = 10,
  options?: SupabaseQueryHookOptions<Reflectie[], ErrorMessage, Reflectie[]>
): QueryHookResult<Reflectie[], ErrorMessage> {
  return useSupabaseQuery<Reflectie[], ErrorMessage, Reflectie[]>(
    ['reflecties', userId, limit],
    async () => {
      if (!userId) return [];
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('reflecties')
        .select<string, Reflectie>('*')
        .eq('user_id', userId)
        .order('datum', { ascending: false })
        .limit(limit);
      if (error) throw handleSupabaseError(error, `reflecties-fetch-${userId}`);
      return (data || []) as Reflectie[];
    },
    {
      enabled: !!userId,
      staleTime: STALE_TIME.REFLECTIES,
      ...options,
    }
  );
}
 
// Hook to get specialists for a patient, including relationId
export function useMySpecialists(
  patientId: string | undefined,
  options?: SupabaseQueryHookOptions<SpecialistWithRelation[], ErrorMessage, SpecialistWithRelation[]>
): QueryHookResult<SpecialistWithRelation[], ErrorMessage> {
  return useSupabaseQuery<SpecialistWithRelation[], ErrorMessage, SpecialistWithRelation[]>(
    ['mySpecialists', patientId],
    async () => {
      if (!patientId) return [];
      const supabase = getSupabaseBrowserClient();
      
      const { data, error } = await supabase
        .from('specialist_patienten')
        .select(`
          id, 
          specialist_id, 
          profiles:specialist_id (
            id,
            voornaam,
            achternaam,
            avatar_url,
            type,
            postcode,
            gemeente,
            geboortedatum
          )
        `)
        .eq('patient_id', patientId);

      if (error) throw handleSupabaseError(error, `mySpecialists-fetch-${patientId}`);
      if (!data) return [];

      const specialistsWithRelation = data.map(relation => {
        // Ensure relation.profiles is treated as Profile, not an array if .single() was implied by FK
        const profileData = Array.isArray(relation.profiles) ? relation.profiles[0] : relation.profiles;

        if (!profileData) {
          console.warn(`Profile data missing for specialist_id: ${relation.specialist_id} in relation ${relation.id}`);
          return null; 
        }
        return {
          ...(profileData as Profile), 
          relationId: relation.id,
        };
      }).filter(Boolean) as SpecialistWithRelation[]; // Filter out any nulls if profile was missing

      return specialistsWithRelation;
    },
    {
      enabled: !!patientId,
      staleTime: STALE_TIME.SPECIALIST_PATIENT_RELATIONS,
      ...options,
    }
  );
}
