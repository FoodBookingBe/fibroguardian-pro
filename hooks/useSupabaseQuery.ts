import { useQuery, useMutation, useQueryClient, UseQueryOptions, QueryKey, QueryFunctionContext } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { handleSupabaseError } from '@/lib/error-handler';
import { PostgrestError } from '@supabase/supabase-js';
import { Task, TaskLog, Profile, Reflectie, Inzicht } from '@/types'; // Assuming these types exist

// Define a more specific type for the raw Supabase query function results
type SupabaseRawQueryFnResult<T> = Promise<{ data: T | null; error: PostgrestError | null }>;

// This is the type for the queryFn that users of useSupabaseQuery will provide
// It's a function that, when called, returns a Supabase "thenable" (Promise-like)
type UserProvidedSupabaseQueryFn<TData> = () => SupabaseRawQueryFnResult<TData>;

// Wrapper hook
export function useSupabaseQuery<
  TQueryFnData = unknown, // Data type returned by the Supabase client method
  TError = PostgrestError | Error,
  TData = TQueryFnData, // Data type returned by useQuery (after select, if any)
  TQueryKey extends QueryKey = QueryKey
>(
  // All options for React Query's useQuery are passed in a single object
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
) {
  // Extract the user's Supabase query function from the options
  const userQueryFn = options.queryFn as unknown as UserProvidedSupabaseQueryFn<TQueryFnData>;

  // Create a new queryFn that React Query will actually execute
  const reactQueryFn = async (context: QueryFunctionContext<TQueryKey>): Promise<TQueryFnData> => {
    // Execute the user's Supabase query function
    const { data, error } = await userQueryFn(); 
    if (error) {
      console.error(`Supabase query error for key "${String(options.queryKey)}":`, error);
      throw error; // Throw error for React Query to handle
    }
    return data as TQueryFnData;
  };

  return useQuery<TQueryFnData, TError, TData, TQueryKey>({
    ...options,
    queryFn: reactQueryFn, // Use the wrapped queryFn
  });
}

// --- Specific Hooks ---

// Specifieke hook voor taken
export function useTasks(userId: string | undefined) {
  return useSupabaseQuery<Task[], PostgrestError | Error>({ // Specify TQueryFnData and TError
    queryKey: ['tasks', userId],
    queryFn: async () => await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId!)
      .order('created_at', { ascending: false }),
    enabled: !!userId,
    onError: (error: PostgrestError | Error) => {
      const errInfo = handleSupabaseError(error, 'taken-ophalen');
      console.error(`Fout bij ophalen taken voor user ${userId}: ${errInfo.technicalMessage || errInfo.userMessage}`);
    }
  });
}

// Hook voor specifieke taak
export function useTask(taskId: string | null | undefined) {
  return useSupabaseQuery<Task | null, PostgrestError | Error>({ // TQueryFnData can be Task or null
    queryKey: ['task', taskId],
    queryFn: async () => taskId
      ? await supabase
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .single()
      : Promise.resolve({ data: null, error: null }),
    enabled: !!taskId,
    onError: (error: PostgrestError | Error) => {
      const errInfo = handleSupabaseError(error, `taak-ophalen-${taskId}`);
      console.error(`Fout bij ophalen taak ${taskId}: ${errInfo.technicalMessage || errInfo.userMessage}`);
    }
  });
}

// Hook voor logs van een taak
export function useTaskLogs(taskId: string | undefined) {
  return useSupabaseQuery<TaskLog[], PostgrestError | Error>({
    queryKey: ['taskLogs', taskId],
    queryFn: async () => await supabase
      .from('task_logs')
      .select('*')
      .eq('task_id', taskId!)
      .order('created_at', { ascending: false }),
    enabled: !!taskId,
    onError: (error: PostgrestError | Error) => {
      const errInfo = handleSupabaseError(error, `logs-ophalen-taak-${taskId}`);
      console.error(`Fout bij ophalen logs voor taak ${taskId}: ${errInfo.technicalMessage || errInfo.userMessage}`);
    }
  });
}

// Hook voor recente logs van een gebruiker
export function useRecentLogs(userId: string | undefined, limit: number = 5) {
  // Define a more specific type for the data if tasks are joined
  type RecentLogWithTask = TaskLog & { tasks: { titel: string } | null };
  return useSupabaseQuery<RecentLogWithTask[], PostgrestError | Error>({
    queryKey: ['recentLogs', userId, limit],
    queryFn: async () => await supabase
      .from('task_logs')
      .select('*, tasks(titel)')
      .eq('user_id', userId!)
      .order('created_at', { ascending: false })
      .limit(limit),
    enabled: !!userId,
    onError: (error: PostgrestError | Error) => {
      const errInfo = handleSupabaseError(error, `recente-logs-ophalen-${userId}`);
      console.error(`Fout bij ophalen recente logs voor user ${userId}: ${errInfo.technicalMessage || errInfo.userMessage}`);
    }
  });
}

// Hook voor user profile
export function useUserProfile(userId: string | null | undefined) {
  return useSupabaseQuery<Profile | null, PostgrestError | Error>({
    queryKey: ['profile', userId],
    queryFn: async () => userId
      ? await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
      : Promise.resolve({ data: null, error: null }),
    enabled: !!userId,
    onError: (error: PostgrestError | Error) => {
      const errInfo = handleSupabaseError(error, `profiel-ophalen-${userId}`);
      console.error(`Fout bij ophalen profiel ${userId}: ${errInfo.technicalMessage || errInfo.userMessage}`);
    }
  });
}

// Hook voor reflecties
export function useReflecties(userId: string | undefined, limit: number = 10) {
  return useSupabaseQuery<Reflectie[], PostgrestError | Error>({
    queryKey: ['reflecties', userId, limit],
    queryFn: async () => await supabase
      .from('reflecties')
      .select('*')
      .eq('user_id', userId!)
      .order('datum', { ascending: false })
      .limit(limit),
    enabled: !!userId,
    onError: (error: PostgrestError | Error) => {
      const errInfo = handleSupabaseError(error, `reflecties-ophalen-${userId}`);
      console.error(`Fout bij ophalen reflecties voor user ${userId}: ${errInfo.technicalMessage || errInfo.userMessage}`);
    }
  });
}

// Hook voor inzichten
export function useInsights(userId: string | undefined, limit: number = 3) {
  return useSupabaseQuery<Inzicht[], PostgrestError | Error>({
    queryKey: ['insights', userId, limit],
    queryFn: async () => await supabase
      .from('inzichten')
      .select('*')
      .eq('user_id', userId!)
      .order('created_at', { ascending: false })
      .limit(limit),
    enabled: !!userId,
    onError: (error: PostgrestError | Error) => {
      const errInfo = handleSupabaseError(error, `inzichten-ophalen-${userId}`);
      console.error(`Fout bij ophalen inzichten voor user ${userId}: ${errInfo.technicalMessage || errInfo.userMessage}`);
    }
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
