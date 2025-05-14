import { useQuery, useMutation, useQueryClient, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { handleSupabaseError } from '@/lib/error-handler';
import { PostgrestError } from '@supabase/supabase-js';

// Define a more specific type for Supabase query function results
type SupabaseQueryFnResult<T> = Promise<{ data: T | null; error: PostgrestError | null }>;

// Generieke hook voor ophalen van Supabase data
export function useSupabaseQuery<TData = unknown, TError = PostgrestError | Error, TQueryKey extends QueryKey = QueryKey>(
  key: TQueryKey, 
  queryFn: () => SupabaseQueryFnResult<TData>,
  options?: Omit<UseQueryOptions<TData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, TError, TData, TQueryKey>({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await queryFn();
      if (error) {
        // Log the detailed error for debugging
        console.error(`Supabase query error for key "${String(key)}":`, error);
        // Throw a new error or the Supabase error to be caught by react-query's onError
        throw error; 
      }
      return data as TData; // Ensure data is cast correctly, or handle null if appropriate
    },
    ...options
  });
}

// --- Specific Hooks ---
// (Types from '@/types' would be imported here if this file was in the same scope,
// but for now, we'll use 'any' or infer from Supabase client)

// Specifieke hook voor taken
export function useTasks(userId: string | undefined) {
  return useSupabaseQuery(
    ['tasks', userId],
    () => supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId!) // Assert userId is defined due to 'enabled' option
      .order('created_at', { ascending: false }),
    {
      enabled: !!userId, // Only run query if userId is available
      onError: (error) => {
        const errInfo = handleSupabaseError(error, 'taken-ophalen');
        console.error(`Fout bij ophalen taken voor user ${userId}: ${errInfo.technicalMessage || errInfo.userMessage}`);
      }
    }
  );
}

// Hook voor specifieke taak
export function useTask(taskId: string | null | undefined) {
  return useSupabaseQuery(
    ['task', taskId],
    () => taskId 
      ? supabase
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .single()
      : Promise.resolve({ data: null, error: null }), // Return a resolved promise for disabled state
    {
      enabled: !!taskId,
      onError: (error) => {
        const errInfo = handleSupabaseError(error, `taak-ophalen-${taskId}`);
        console.error(`Fout bij ophalen taak ${taskId}: ${errInfo.technicalMessage || errInfo.userMessage}`);
      }
    }
  );
}

// Hook voor logs van een taak
export function useTaskLogs(taskId: string | undefined) {
  return useSupabaseQuery(
    ['taskLogs', taskId],
    () => supabase
      .from('task_logs')
      .select('*')
      .eq('task_id', taskId!) // Assert taskId is defined
      .order('created_at', { ascending: false }),
    {
      enabled: !!taskId,
      onError: (error) => {
        const errInfo = handleSupabaseError(error, `logs-ophalen-taak-${taskId}`);
        console.error(`Fout bij ophalen logs voor taak ${taskId}: ${errInfo.technicalMessage || errInfo.userMessage}`);
      }
    }
  );
}

// Hook voor recente logs van een gebruiker
export function useRecentLogs(userId: string | undefined, limit: number = 5) {
  return useSupabaseQuery(
    ['recentLogs', userId, limit],
    () => supabase
      .from('task_logs')
      .select('*, tasks(titel)') // Example of joining to get task title
      .eq('user_id', userId!) // Assert userId is defined
      .order('created_at', { ascending: false })
      .limit(limit),
    {
      enabled: !!userId,
      onError: (error) => {
        const errInfo = handleSupabaseError(error, `recente-logs-ophalen-${userId}`);
        console.error(`Fout bij ophalen recente logs voor user ${userId}: ${errInfo.technicalMessage || errInfo.userMessage}`);
      }
    }
  );
}

// Hook voor user profile
export function useUserProfile(userId: string | null | undefined) {
  return useSupabaseQuery(
    ['profile', userId],
    () => userId 
      ? supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
      : Promise.resolve({ data: null, error: null }),
    {
      enabled: !!userId,
      onError: (error) => {
        const errInfo = handleSupabaseError(error, `profiel-ophalen-${userId}`);
        console.error(`Fout bij ophalen profiel ${userId}: ${errInfo.technicalMessage || errInfo.userMessage}`);
      }
    }
  );
}

// Hook voor reflecties
export function useReflecties(userId: string | undefined, limit: number = 10) {
  return useSupabaseQuery(
    ['reflecties', userId, limit],
    () => supabase
      .from('reflecties')
      .select('*')
      .eq('user_id', userId!) // Assert userId is defined
      .order('datum', { ascending: false })
      .limit(limit),
    {
      enabled: !!userId,
      onError: (error) => {
        const errInfo = handleSupabaseError(error, `reflecties-ophalen-${userId}`);
        console.error(`Fout bij ophalen reflecties voor user ${userId}: ${errInfo.technicalMessage || errInfo.userMessage}`);
      }
    }
  );
}

// Hook voor inzichten
export function useInsights(userId: string | undefined, limit: number = 3) {
  return useSupabaseQuery(
    ['insights', userId, limit],
    () => supabase
      .from('inzichten')
      .select('*')
      .eq('user_id', userId!) // Assert userId is defined
      .order('created_at', { ascending: false })
      .limit(limit),
    {
      enabled: !!userId,
      onError: (error) => {
        const errInfo = handleSupabaseError(error, `inzichten-ophalen-${userId}`);
        console.error(`Fout bij ophalen inzichten voor user ${userId}: ${errInfo.technicalMessage || errInfo.userMessage}`);
      }
    }
  );
}

// --- Mutation Hooks ---

interface UpsertTaskVariables {
  task: any; // Replace 'any' with your TaskInsert or TaskUpdate type from types/database.ts
  userId: string;
  taskId?: string | null;
}

export function useUpsertTask() {
  const queryClient = useQueryClient();
  
  return useMutation<any, PostgrestError | Error, UpsertTaskVariables>({ // Specify types for data, error, variables
    mutationFn: async ({ task, userId, taskId = null }) => {
      const taskWithUserId = { ...task, user_id: userId };
      
      const result = taskId
        ? await supabase.from('tasks').update(taskWithUserId).eq('id', taskId).select().single()
        : await supabase.from('tasks').insert([taskWithUserId]).select().single();
      
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.userId] });
      if (variables.taskId) {
        queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      }
      // Optionally, update the specific task query data directly
      if (data && data.id) {
        queryClient.setQueryData(['task', data.id], data);
      }
    },
    onError: (error, variables) => {
      const action = variables.taskId ? 'bijwerken' : 'aanmaken';
      const errInfo = handleSupabaseError(error, `taak-${action}`);
      console.error(`Fout bij ${action} van taak: ${errInfo.technicalMessage || errInfo.userMessage}`);
      // Potentially show a toast notification to the user here
    }
  });
}


interface AddTaskLogVariables {
  log: any; // Replace 'any' with your TaskLogInsert type
  userId: string;
  taskId: string;
}

export function useAddTaskLog() {
  const queryClient = useQueryClient();
  
  return useMutation<any, PostgrestError | Error, AddTaskLogVariables>({
    mutationFn: async ({ log, userId, taskId }) => {
      const logWithIds = { ...log, user_id: userId, task_id: taskId };
      const result = await supabase.from('task_logs').insert([logWithIds]).select().single();
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['taskLogs', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['recentLogs', variables.userId] });
       // Optionally update dashboard data if it relies on recent logs
      queryClient.invalidateQueries({ queryKey: ['dashboardData', variables.userId] }); // Example
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
      // First, delete related task_logs to avoid foreign key constraint violations
      const { error: logDeleteError } = await supabase
        .from('task_logs')
        .delete()
        .eq('task_id', taskId);

      if (logDeleteError) {
        // If deleting logs fails, we might not want to proceed with deleting the task,
        // or handle this case specifically (e.g., log it, notify user).
        // For now, we'll throw the error to stop the mutation.
        console.error(`Failed to delete logs for task ${taskId}:`, logDeleteError);
        throw logDeleteError;
      }

      // Then, delete the task itself
      const { error: taskDeleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', userId); // Ensure user owns the task
      
      if (taskDeleteError) throw taskDeleteError;
      return { success: true };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.userId] });
      // Remove the deleted task from any specific task queries
      queryClient.removeQueries({ queryKey: ['task', variables.taskId] });
    },
    onError: (error) => {
      const errInfo = handleSupabaseError(error, 'taak-verwijderen');
      console.error(`Fout bij verwijderen van taak: ${errInfo.technicalMessage || errInfo.userMessage}`);
    }
  });
}