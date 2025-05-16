import { useQuery, QueryKey, UseQueryResult } from '@tanstack/react-query'; 
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { handleSupabaseError, ErrorMessage } from '@/lib/error-handler';
import { Task, Profile, TaskLog, Reflectie, Inzicht, SpecialistPatient } from '@/types';
import { QueryHookResult, SupabaseQueryHookOptions, SupabaseQueryFunction } from '@/types/query'; 
import { STALE_TIME } from '@/lib/QueryClientConfig'; // Import STALE_TIME constants

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
    // Default staleTime from QueryClientConfig will apply if not overridden here or in specific hook options
    // staleTime: 5 * 60 * 1000, // This was a generic default, specific hooks will set their own
    ...options,
  });
}

/**
 * Hook to fetch a user's profile data.
 * @param userId - The ID of the user to fetch the profile for. Can be null or undefined if no user is logged in.
 * @param options - Optional React Query options.
 * @returns QueryHookResult with profile data (Profile | null) and query state.
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw handleSupabaseError(error, 'profile-fetch');
      return data as Profile | null;
    },
    {
      enabled: !!userId,
      staleTime: STALE_TIME.PROFILES,
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
      staleTime: STALE_TIME.TASKS, // Individual task might share same stale time as list or have its own
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

export function useMyPatients(
  specialistId: string | undefined,
  options?: SupabaseQueryHookOptions<Profile[], ErrorMessage, Profile[]>
): QueryHookResult<Profile[], ErrorMessage> {
  return useSupabaseQuery<Profile[], ErrorMessage, Profile[]>(
    ['myPatients', specialistId],
    async () => {
      if (!specialistId) return [];
      const supabase = getSupabaseBrowserClient();
      const { data: relations, error: relationError } = await supabase
        .from('specialist_patienten')
        .select('patient_id')
        .eq('specialist_id', specialistId);
      if (relationError) throw handleSupabaseError(relationError, `myPatients-relations-fetch-${specialistId}`);
      if (!relations || relations.length === 0) return [];
      const patientIds = relations.map(r => r.patient_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select<string, Profile>('*')
        .in('id', patientIds);
      if (profileError) throw handleSupabaseError(profileError, `myPatients-profiles-fetch-${specialistId}`);
      return (profiles || []) as Profile[];
    },
    {
      enabled: !!specialistId,
      staleTime: STALE_TIME.SPECIALIST_PATIENT_RELATIONS,
      ...options,
    }
  );
}

export function useMySpecialists(
  patientId: string | undefined,
  options?: SupabaseQueryHookOptions<Profile[], ErrorMessage, Profile[]>
): QueryHookResult<Profile[], ErrorMessage> {
  return useSupabaseQuery<Profile[], ErrorMessage, Profile[]>(
    ['mySpecialists', patientId],
    async () => {
      if (!patientId) return [];
      const supabase = getSupabaseBrowserClient();
      const { data: relations, error: relationError } = await supabase
        .from('specialist_patienten')
        .select('specialist_id')
        .eq('patient_id', patientId);
      if (relationError) throw handleSupabaseError(relationError, `mySpecialists-relations-fetch-${patientId}`);
      if (!relations || relations.length === 0) return [];
      const specialistIds = relations.map(r => r.specialist_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select<string, Profile>('*')
        .in('id', specialistIds);
      if (profileError) throw handleSupabaseError(profileError, `mySpecialists-profiles-fetch-${patientId}`);
      return (profiles || []) as Profile[];
    },
    {
      enabled: !!patientId,
      staleTime: STALE_TIME.SPECIALIST_PATIENT_RELATIONS,
      ...options,
    }
  );
}
