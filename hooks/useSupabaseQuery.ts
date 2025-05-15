import { useQuery, useMutation, useQueryClient, UseQueryOptions, QueryKey, QueryFunctionContext } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { handleSupabaseError } from '@/lib/error-handler';
import { PostgrestError } from '@supabase/supabase-js';
import { Task, TaskLog, Profile, Reflectie, Inzicht } from '@/types'; // Assuming these types exist

// Define a more specific type for the raw Supabase query function results
type SupabaseRawQueryFnResult<T> = Promise<{ data: T | null; error: PostgrestError | null }>;

// This is the type for the queryFn that users of useSupabaseQuery will provide
// It's a function that, when called, returns a Supabase "thenable" (Promise-like)
type UserProvidedSupabaseQueryFn<TData> = () => SupabaseRawQueryFnResult<TData>;

// Wrapper hook
// Wrapper hook
export function useSupabaseQuery<
  TActualData, // Core data type from Supabase if successful (e.g., Task[] or Task)
  TError = PostgrestError | Error,
  // TFinalData is what the hook user ultimately gets. Defaults to TActualData | null.
  TFinalData = TActualData | null,
  TQueryKey extends QueryKey = QueryKey
>(
  // options.queryFn returns a Supabase promise-like object.
  // The TQueryFnData for the underlying useQuery will be TActualData | null.
  options: Omit<UseQueryOptions<TActualData | null, TError, TFinalData, TQueryKey>, 'queryFn'> & {
    queryFn: () => PromiseLike<{ data: TActualData | null; error: PostgrestError | null }>;
  }
) {
  // This function is passed to React Query's useQuery.
  // It must return Promise<TActualData | null> based on the useQuery signature below.
  const reactQueryCompatibleQueryFn = async (): Promise<TActualData | null> => {
    const supabasePromise = options.queryFn();
    const supabaseResult = await supabasePromise; // supabaseResult is { data: TActualData | null, error: ... }

    if (supabaseResult.error) {
      console.error(`Supabase query error for key "${String(options.queryKey)}":`, supabaseResult.error);
      const errInfo = handleSupabaseError(supabaseResult.error, `query-${String(options.queryKey)}`);
      throw errInfo;
    }
    return supabaseResult.data; // This is TActualData | null
  };

  // The first generic to useQuery is TQueryFnData (what reactQueryCompatibleQueryFn returns).
  // The third generic is TData (what the useQuery hook returns, TFinalData in our case).
  return useQuery<TActualData | null, TError, TFinalData, TQueryKey>({
    ...options,
    queryFn: reactQueryCompatibleQueryFn,
  });
}
// --- Specific Hooks ---

// Specifieke hook voor taken
export function useTasks(userId: string | undefined) {
  const supabase = getSupabaseBrowserClient();
  return useSupabaseQuery<
    Task[], // TActualData: Supabase will provide Task[] or null for the data field
    PostgrestError | Error,
    Task[]  // TFinalData: We want the hook to return Task[] (non-null)
  >({
    queryKey: ['tasks', userId],
    queryFn: () => supabase
      .from('tasks')
      .select<'*', Task>('*') // Explicitly type the select
      .eq('user_id', userId!)
      .order('created_at', { ascending: false }),
    enabled: !!userId,
    select: (data: Task[] | null): Task[] => data || [],
  });
}

// Hook voor specifieke taak
export function useTask(taskId: string | null | undefined) {
  const supabase = getSupabaseBrowserClient();
  return useSupabaseQuery<
    Task, // TActualData: Supabase will provide Task or null for the data field
    PostgrestError | Error,
    Task | null // TFinalData: We want Task | null, which matches TActualData | null
  >({
    queryKey: ['task', taskId],
    queryFn: () => taskId
      ? supabase
          .from('tasks')
          .select<'*', Task>('*') // Explicitly type the select
          .eq('id', taskId)
          .single()
      : Promise.resolve({ data: null, error: null }),
    enabled: !!taskId,
  });
}

// Hook voor logs van een taak
export function useTaskLogs(taskId: string | undefined) {
  const supabase = getSupabaseBrowserClient();
  return useSupabaseQuery<
    TaskLog[], // TActualData
    PostgrestError | Error,
    TaskLog[]  // TFinalData
  >({
    queryKey: ['taskLogs', taskId],
    queryFn: () => supabase
      .from('task_logs')
      .select<'*', TaskLog>('*') // Explicitly type the select
      .eq('task_id', taskId!)
      .order('created_at', { ascending: false }),
    enabled: !!taskId,
    select: (data: TaskLog[] | null): TaskLog[] => data || [],
  });
}

// Hook voor recente logs van een gebruiker
export function useRecentLogs(userId: string | undefined, limit: number = 5) {
  type RecentLogWithTask = TaskLog & { tasks: { titel: string } | null };
  const supabase = getSupabaseBrowserClient();
  return useSupabaseQuery<
    RecentLogWithTask[], // TActualData
    PostgrestError | Error,
    RecentLogWithTask[]  // TFinalData
  >({
    queryKey: ['recentLogs', userId, limit],
    queryFn: () => supabase
      .from('task_logs')
      // For custom select strings like this, ensure RecentLogWithTask matches the output structure.
      // The generic on select might be more complex or rely on Supabase's schema typing if available.
      // Assuming RecentLogWithTask is correctly defined for '*, tasks(titel)'
      .select<'*, tasks(titel)', RecentLogWithTask>('*, tasks(titel)')
      .eq('user_id', userId!)
      .order('created_at', { ascending: false })
      .limit(limit),
    enabled: !!userId,
    select: (data: RecentLogWithTask[] | null): RecentLogWithTask[] => data || [],
  });
}

// Hook voor user profile
export function useUserProfile(userId: string | null | undefined) {
  const supabase = getSupabaseBrowserClient();
  return useSupabaseQuery<
    Profile, // TActualData
    PostgrestError | Error,
    Profile | null // TFinalData
  >({
    queryKey: ['profile', userId],
    queryFn: () => userId
      ? supabase
          .from('profiles')
          .select<'*', Profile>('*') // Explicitly type the select
          .eq('id', userId)
          .single()
      : Promise.resolve({ data: null, error: null }),
    enabled: !!userId,
  });
}

// Hook voor reflecties
export function useReflecties(userId: string | undefined, limit: number = 10) {
  const supabase = getSupabaseBrowserClient();
  return useSupabaseQuery<
    Reflectie[], // TActualData
    PostgrestError | Error,
    Reflectie[]  // TFinalData
  >({
    queryKey: ['reflecties', userId, limit],
    queryFn: () => supabase
      .from('reflecties')
      .select<'*', Reflectie>('*') // Explicitly type the select
      .eq('user_id', userId!)
      .order('datum', { ascending: false })
      .limit(limit),
    enabled: !!userId,
    select: (data: Reflectie[] | null): Reflectie[] => data || [],
  });
}

// Hook voor inzichten
export function useInsights(userId: string | undefined, limit: number = 3) {
  const supabase = getSupabaseBrowserClient();
  return useSupabaseQuery<
    Inzicht[], // TActualData
    PostgrestError | Error,
    Inzicht[]  // TFinalData
  >({
    queryKey: ['insights', userId, limit],
    queryFn: () => supabase
      .from('inzichten')
      .select<'*', Inzicht>('*') // Explicitly type the select
      .eq('user_id', userId!)
      .order('created_at', { ascending: false })
      .limit(limit),
    enabled: !!userId,
    select: (data: Inzicht[] | null): Inzicht[] => data || [],
  });
}

// --- Mutation Hooks ---

interface UpsertTaskVariables {
  task: Partial<Task>; // Use Partial<Task> or a specific insert/update type
  userId: string;
  taskId?: string | null;
}

export function useUpsertTask() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();
  return useMutation<Task | null, PostgrestError | Error, UpsertTaskVariables>({
    mutationFn: async ({ task, userId, taskId = null }) => {
      const taskWithUserId = { ...task, user_id: userId };
      const result = taskId
        ? await supabase.from('tasks').update(taskWithUserId).eq('id', taskId).select().single()
        : await supabase.from('tasks').insert(taskWithUserId as Task).select().single(); // Cast if needed
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.userId] });
      if (variables.taskId) {
        queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      }
      if (data?.id) {
        queryClient.setQueryData(['task', data.id], data);
      }
    },
    onError: (error, variables) => {
      const action = variables.taskId ? 'bijwerken' : 'aanmaken';
      const errInfo = handleSupabaseError(error, `taak-${action}`);
      console.error(`Fout bij ${action} van taak: ${errInfo.technicalMessage || errInfo.userMessage}`);
    }
  });
}

interface AddTaskLogVariables {
  log: Partial<TaskLog>; // Use Partial<TaskLog> or a specific insert type
  userId: string;
  taskId: string;
}

export function useAddTaskLog() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();
  return useMutation<TaskLog | null, PostgrestError | Error, AddTaskLogVariables>({
    mutationFn: async ({ log, userId, taskId }) => {
      const logWithIds = { ...log, user_id: userId, task_id: taskId };
      const result = await supabase.from('task_logs').insert(logWithIds as TaskLog).select().single(); // Cast if needed
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['taskLogs', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['recentLogs', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData', variables.userId] });
    },
    onError: (error) => {
      const errInfo = handleSupabaseError(error, 'log-opslaan');
      console.error(`Fout bij toevoegen van log: ${errInfo.technicalMessage || errInfo.userMessage}`);
    }
  });
}

interface DeleteTaskVariables {
  taskId: string;
  userId: string;
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();
  return useMutation<{ success: boolean }, PostgrestError | Error, DeleteTaskVariables>({
    mutationFn: async ({ taskId, userId }) => {
      const { error: logDeleteError } = await supabase
        .from('task_logs')
        .delete()
        .eq('task_id', taskId);
      if (logDeleteError) {
        console.error(`Failed to delete logs for task ${taskId}:`, logDeleteError);
        throw logDeleteError;
      }
      const { error: taskDeleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', userId);
      if (taskDeleteError) throw taskDeleteError;
      return { success: true };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.userId] });
      queryClient.removeQueries({ queryKey: ['task', variables.taskId] });
    },
    onError: (error) => {
      const errInfo = handleSupabaseError(error, 'taak-verwijderen');
      console.error(`Fout bij verwijderen van taak: ${errInfo.technicalMessage || errInfo.userMessage}`);
    }
  });
}
