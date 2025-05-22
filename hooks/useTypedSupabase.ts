/**
 * useTypedSupabase.ts
 * 
 * This hook provides a fully typed Supabase client for FibroGuardian Pro.
 * It ensures type safety for all database operations and enforces proper
 * data validation and error handling patterns.
 */

import { useCallback } from 'react';

import { PostgrestError } from '@supabase/supabase-js';
import { z } from 'zod';

import { useAuth } from '@/components/auth/AuthProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { Database } from '@/types/database';

// Type for query responses
export interface TypedQueryResponse<T> {
  data: T | null;
  error: PostgrestError | null;
  status: 'loading' | 'error' | 'success';
  count: number | null;
}

// Type for mutation responses
export interface TypedMutationResponse<T> {
  data: T | null;
  error: PostgrestError | null;
  status: 'idle' | 'loading' | 'error' | 'success';
}

// Main hook interface
export interface TypedSupabaseClient {
  // Profiles
  profiles: {
    getById: (id: string) => Promise<TypedQueryResponse<Database['public']['Tables']['profiles']['Row']>>;
    getByUserId: (userId: string) => Promise<TypedQueryResponse<Database['public']['Tables']['profiles']['Row']>>;
    getMe: () => Promise<TypedQueryResponse<Database['public']['Tables']['profiles']['Row']>>;
    update: (id: string, data: Partial<Database['public']['Tables']['profiles']['Update']>) => Promise<TypedMutationResponse<Database['public']['Tables']['profiles']['Row']>>;
    create: (data: Database['public']['Tables']['profiles']['Insert']) => Promise<TypedMutationResponse<Database['public']['Tables']['profiles']['Row']>>;
  };
  
  // Tasks
  tasks: {
    getAll: () => Promise<TypedQueryResponse<Database['public']['Tables']['tasks']['Row'][]>>;
    getById: (id: string) => Promise<TypedQueryResponse<Database['public']['Tables']['tasks']['Row']>>;
    getByUser: (userId: string) => Promise<TypedQueryResponse<Database['public']['Tables']['tasks']['Row'][]>>;
    create: (data: Database['public']['Tables']['tasks']['Insert']) => Promise<TypedMutationResponse<Database['public']['Tables']['tasks']['Row']>>;
    update: (id: string, data: Partial<Database['public']['Tables']['tasks']['Update']>) => Promise<TypedMutationResponse<Database['public']['Tables']['tasks']['Row']>>;
    delete: (id: string) => Promise<TypedMutationResponse<null>>;
  };
  
  // Task Logs
  taskLogs: {
    getAll: () => Promise<TypedQueryResponse<Database['public']['Tables']['task_logs']['Row'][]>>;
    getById: (id: string) => Promise<TypedQueryResponse<Database['public']['Tables']['task_logs']['Row']>>;
    getByUser: (userId: string) => Promise<TypedQueryResponse<Database['public']['Tables']['task_logs']['Row'][]>>;
    getByTask: (taskId: string) => Promise<TypedQueryResponse<Database['public']['Tables']['task_logs']['Row'][]>>;
    create: (data: Database['public']['Tables']['task_logs']['Insert']) => Promise<TypedMutationResponse<Database['public']['Tables']['task_logs']['Row']>>;
    update: (id: string, data: Partial<Database['public']['Tables']['task_logs']['Update']>) => Promise<TypedMutationResponse<Database['public']['Tables']['task_logs']['Row']>>;
    delete: (id: string) => Promise<TypedMutationResponse<null>>;
  };
  
  // Reflecties (Reflections)
  reflecties: {
    getAll: () => Promise<TypedQueryResponse<Database['public']['Tables']['reflecties']['Row'][]>>;
    getById: (id: string) => Promise<TypedQueryResponse<Database['public']['Tables']['reflecties']['Row']>>;
    getByUser: (userId: string) => Promise<TypedQueryResponse<Database['public']['Tables']['reflecties']['Row'][]>>;
    getByDateRange: (userId: string, startDate: string, endDate: string) => Promise<TypedQueryResponse<Database['public']['Tables']['reflecties']['Row'][]>>;
    create: (data: Database['public']['Tables']['reflecties']['Insert']) => Promise<TypedMutationResponse<Database['public']['Tables']['reflecties']['Row']>>;
    update: (id: string, data: Partial<Database['public']['Tables']['reflecties']['Update']>) => Promise<TypedMutationResponse<Database['public']['Tables']['reflecties']['Row']>>;
    delete: (id: string) => Promise<TypedMutationResponse<null>>;
  };
  
  // Expert Knowledge
  expertKnowledge: {
    getAll: () => Promise<TypedQueryResponse<Database['public']['Tables']['expert_knowledge']['Row'][]>>;
    getById: (id: string) => Promise<TypedQueryResponse<Database['public']['Tables']['expert_knowledge']['Row']>>;
    getBySpecialist: (specialistId: string) => Promise<TypedQueryResponse<Database['public']['Tables']['expert_knowledge']['Row'][]>>;
    getByContentType: (contentType: string) => Promise<TypedQueryResponse<Database['public']['Tables']['expert_knowledge']['Row'][]>>;
    create: (data: Database['public']['Tables']['expert_knowledge']['Insert']) => Promise<TypedMutationResponse<Database['public']['Tables']['expert_knowledge']['Row']>>;
    update: (id: string, data: Partial<Database['public']['Tables']['expert_knowledge']['Update']>) => Promise<TypedMutationResponse<Database['public']['Tables']['expert_knowledge']['Row']>>;
    delete: (id: string) => Promise<TypedMutationResponse<null>>;
  };
  
  // AI Recommendations
  aiRecommendations: {
    getAll: () => Promise<TypedQueryResponse<Database['public']['Tables']['ai_recommendations']['Row'][]>>;
    getById: (id: string) => Promise<TypedQueryResponse<Database['public']['Tables']['ai_recommendations']['Row']>>;
    getByUser: (userId: string) => Promise<TypedQueryResponse<Database['public']['Tables']['ai_recommendations']['Row'][]>>;
    getByContextType: (contextType: string) => Promise<TypedQueryResponse<Database['public']['Tables']['ai_recommendations']['Row'][]>>;
    create: (data: Database['public']['Tables']['ai_recommendations']['Insert']) => Promise<TypedMutationResponse<Database['public']['Tables']['ai_recommendations']['Row']>>;
    update: (id: string, data: Partial<Database['public']['Tables']['ai_recommendations']['Update']>) => Promise<TypedMutationResponse<Database['public']['Tables']['ai_recommendations']['Row']>>;
    delete: (id: string) => Promise<TypedMutationResponse<null>>;
    dismiss: (id: string) => Promise<TypedMutationResponse<Database['public']['Tables']['ai_recommendations']['Row']>>;
  };
  
  // Specialist-Patient Relations
  specialistPatienten: {
    getAll: () => Promise<TypedQueryResponse<Database['public']['Tables']['specialist_patienten']['Row'][]>>;
    getById: (id: string) => Promise<TypedQueryResponse<Database['public']['Tables']['specialist_patienten']['Row']>>;
    getBySpecialist: (specialistId: string) => Promise<TypedQueryResponse<Database['public']['Tables']['specialist_patienten']['Row'][]>>;
    getByPatient: (patientId: string) => Promise<TypedQueryResponse<Database['public']['Tables']['specialist_patienten']['Row'][]>>;
    create: (data: Database['public']['Tables']['specialist_patienten']['Insert']) => Promise<TypedMutationResponse<Database['public']['Tables']['specialist_patienten']['Row']>>;
    update: (id: string, data: Partial<Database['public']['Tables']['specialist_patienten']['Update']>) => Promise<TypedMutationResponse<Database['public']['Tables']['specialist_patienten']['Row']>>;
    delete: (id: string) => Promise<TypedMutationResponse<null>>;
  };
  
  // Raw query execution (for advanced use cases)
  executeRawQuery: <T>(query: string, params?: unknown[]) => Promise<TypedQueryResponse<T>>;
  
  // Validation helpers
  validate: <T>(schema: z.ZodType<T>, data: unknown) => T;
}

/**
 * Hook for accessing the typed Supabase client
 * 
 * @returns A typed Supabase client with methods for all tables
 */
export function useTypedSupabase(): { typedQuery: TypedSupabaseClient } {
  const { user } = useAuth();
  
  // Validation helper
  const validate = useCallback(<T>(schema: z.ZodType<T>, data: unknown): T => {
    try {
      return schema.parse(data);
    } catch (error) {
      console.error('Validation error:', error);
      throw new Error('Data validation failed');
    }
  }, []);
  
  // Raw query execution
  const executeRawQuery = useCallback(async <T>(query: string, params?: unknown[]): Promise<TypedQueryResponse<T>> => {
    const supabase = getSupabaseBrowserClient();
    try {
      const { data, error } = await supabase.rpc(query, params || {});
      return {
        data,
        error,
        status: error ? 'error' : 'success',
        count: null
      };
    } catch (error) {
      return {
        data: null,
        error: error as PostgrestError,
        status: 'error',
        count: null
      };
    }
  }, []);
  
  // Return the typed client
  return {
    typedQuery: {
      // Profiles
      profiles: {
        getById: async (id) => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .eq('id', id)
            .single();
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        getByUserId: async (userId) => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .single();
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        getMe: async () => {
          if (!user) {
            return {
              data: null,
              error: { message: 'User not authenticated', details: '', hint: '', code: 'UNAUTHENTICATED' } as PostgrestError,
              status: 'error',
              count: null
            };
          }
          
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .single();
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        update: async (id, data) => {
          const supabase = getSupabaseBrowserClient();
          const { data: updatedData, error } = await supabase
            .from('profiles')
            .update(data)
            .eq('id', id)
            .select()
            .single();
          
          return {
            data: updatedData,
            error,
            status: error ? 'error' : 'success'
          };
        },
        
        create: async (data) => {
          const supabase = getSupabaseBrowserClient();
          const { data: createdData, error } = await supabase
            .from('profiles')
            .insert(data)
            .select()
            .single();
          
          return {
            data: createdData,
            error,
            status: error ? 'error' : 'success'
          };
        }
      },
      
      // Tasks
      tasks: {
        getAll: async () => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('tasks')
            .select('*', { count: 'exact' });
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        getById: async (id) => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('tasks')
            .select('*', { count: 'exact' })
            .eq('id', id)
            .single();
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        getByUser: async (userId) => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('tasks')
            .select('*', { count: 'exact' })
            .eq('user_id', userId);
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        create: async (data) => {
          const supabase = getSupabaseBrowserClient();
          const { data: createdData, error } = await supabase
            .from('tasks')
            .insert(data)
            .select()
            .single();
          
          return {
            data: createdData,
            error,
            status: error ? 'error' : 'success'
          };
        },
        
        update: async (id, data) => {
          const supabase = getSupabaseBrowserClient();
          const { data: updatedData, error } = await supabase
            .from('tasks')
            .update(data)
            .eq('id', id)
            .select()
            .single();
          
          return {
            data: updatedData,
            error,
            status: error ? 'error' : 'success'
          };
        },
        
        delete: async (id) => {
          const supabase = getSupabaseBrowserClient();
          const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);
          
          return {
            data: null,
            error,
            status: error ? 'error' : 'success'
          };
        }
      },
      
      // Task Logs
      taskLogs: {
        getAll: async () => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('task_logs')
            .select('*', { count: 'exact' });
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        getById: async (id) => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('task_logs')
            .select('*', { count: 'exact' })
            .eq('id', id)
            .single();
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        getByUser: async (userId) => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('task_logs')
            .select('*', { count: 'exact' })
            .eq('user_id', userId);
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        getByTask: async (taskId) => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('task_logs')
            .select('*', { count: 'exact' })
            .eq('task_id', taskId);
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        create: async (data) => {
          const supabase = getSupabaseBrowserClient();
          const { data: createdData, error } = await supabase
            .from('task_logs')
            .insert(data)
            .select()
            .single();
          
          return {
            data: createdData,
            error,
            status: error ? 'error' : 'success'
          };
        },
        
        update: async (id, data) => {
          const supabase = getSupabaseBrowserClient();
          const { data: updatedData, error } = await supabase
            .from('task_logs')
            .update(data)
            .eq('id', id)
            .select()
            .single();
          
          return {
            data: updatedData,
            error,
            status: error ? 'error' : 'success'
          };
        },
        
        delete: async (id) => {
          const supabase = getSupabaseBrowserClient();
          const { error } = await supabase
            .from('task_logs')
            .delete()
            .eq('id', id);
          
          return {
            data: null,
            error,
            status: error ? 'error' : 'success'
          };
        }
      },
      
      // Reflecties
      reflecties: {
        getAll: async () => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('reflecties')
            .select('*', { count: 'exact' });
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        getById: async (id) => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('reflecties')
            .select('*', { count: 'exact' })
            .eq('id', id)
            .single();
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        getByUser: async (userId) => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('reflecties')
            .select('*', { count: 'exact' })
            .eq('user_id', userId);
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        getByDateRange: async (userId, startDate, endDate) => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('reflecties')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .gte('datum', startDate)
            .lte('datum', endDate);
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        create: async (data) => {
          const supabase = getSupabaseBrowserClient();
          const { data: createdData, error } = await supabase
            .from('reflecties')
            .insert(data)
            .select()
            .single();
          
          return {
            data: createdData,
            error,
            status: error ? 'error' : 'success'
          };
        },
        
        update: async (id, data) => {
          const supabase = getSupabaseBrowserClient();
          const { data: updatedData, error } = await supabase
            .from('reflecties')
            .update(data)
            .eq('id', id)
            .select()
            .single();
          
          return {
            data: updatedData,
            error,
            status: error ? 'error' : 'success'
          };
        },
        
        delete: async (id) => {
          const supabase = getSupabaseBrowserClient();
          const { error } = await supabase
            .from('reflecties')
            .delete()
            .eq('id', id);
          
          return {
            data: null,
            error,
            status: error ? 'error' : 'success'
          };
        }
      },
      
      // Expert Knowledge
      expertKnowledge: {
        getAll: async () => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('expert_knowledge')
            .select('*', { count: 'exact' });
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        getById: async (id) => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('expert_knowledge')
            .select('*', { count: 'exact' })
            .eq('id', id)
            .single();
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        getBySpecialist: async (specialistId) => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('expert_knowledge')
            .select('*', { count: 'exact' })
            .eq('specialist_id', specialistId);
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        getByContentType: async (contentType) => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('expert_knowledge')
            .select('*', { count: 'exact' })
            .eq('content_type', contentType);
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        create: async (data) => {
          const supabase = getSupabaseBrowserClient();
          const { data: createdData, error } = await supabase
            .from('expert_knowledge')
            .insert(data)
            .select()
            .single();
          
          return {
            data: createdData,
            error,
            status: error ? 'error' : 'success'
          };
        },
        
        update: async (id, data) => {
          const supabase = getSupabaseBrowserClient();
          const { data: updatedData, error } = await supabase
            .from('expert_knowledge')
            .update(data)
            .eq('id', id)
            .select()
            .single();
          
          return {
            data: updatedData,
            error,
            status: error ? 'error' : 'success'
          };
        },
        
        delete: async (id) => {
          const supabase = getSupabaseBrowserClient();
          const { error } = await supabase
            .from('expert_knowledge')
            .delete()
            .eq('id', id);
          
          return {
            data: null,
            error,
            status: error ? 'error' : 'success'
          };
        }
      },
      
      // AI Recommendations
      aiRecommendations: {
        getAll: async () => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('ai_recommendations')
            .select('*', { count: 'exact' });
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        getById: async (id) => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('ai_recommendations')
            .select('*', { count: 'exact' })
            .eq('id', id)
            .single();
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        getByUser: async (userId) => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('ai_recommendations')
            .select('*', { count: 'exact' })
            .eq('user_id', userId);
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        getByContextType: async (contextType) => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('ai_recommendations')
            .select('*', { count: 'exact' })
            .eq('context_type', contextType);
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        create: async (data) => {
          const supabase = getSupabaseBrowserClient();
          const { data: createdData, error } = await supabase
            .from('ai_recommendations')
            .insert(data)
            .select()
            .single();
          
          return {
            data: createdData,
            error,
            status: error ? 'error' : 'success'
          };
        },
        
        update: async (id, data) => {
          const supabase = getSupabaseBrowserClient();
          const { data: updatedData, error } = await supabase
            .from('ai_recommendations')
            .update(data)
            .eq('id', id)
            .select()
            .single();
          
          return {
            data: updatedData,
            error,
            status: error ? 'error' : 'success'
          };
        },
        
        delete: async (id) => {
          const supabase = getSupabaseBrowserClient();
          const { error } = await supabase
            .from('ai_recommendations')
            .delete()
            .eq('id', id);
          
          return {
            data: null,
            error,
            status: error ? 'error' : 'success'
          };
        },
        
        dismiss: async (id) => {
          const supabase = getSupabaseBrowserClient();
          const { data: updatedData, error } = await supabase
            .from('ai_recommendations')
            .update({ is_dismissed: true })
            .eq('id', id)
            .select()
            .single();
          
          return {
            data: updatedData,
            error,
            status: error ? 'error' : 'success'
          };
        }
      },
      
      // Specialist-Patient Relations
      specialistPatienten: {
        getAll: async () => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('specialist_patienten')
            .select('*', { count: 'exact' });
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        getById: async (id) => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('specialist_patienten')
            .select('*', { count: 'exact' })
            .eq('id', id)
            .single();
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        getBySpecialist: async (specialistId) => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('specialist_patienten')
            .select('*', { count: 'exact' })
            .eq('specialist_id', specialistId);
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        getByPatient: async (patientId) => {
          const supabase = getSupabaseBrowserClient();
          const { data, error, count } = await supabase
            .from('specialist_patienten')
            .select('*', { count: 'exact' })
            .eq('patient_id', patientId);
          
          return {
            data,
            error,
            status: error ? 'error' : 'success',
            count
          };
        },
        
        create: async (data) => {
          const supabase = getSupabaseBrowserClient();
          const { data: createdData, error } = await supabase
            .from('specialist_patienten')
            .insert(data)
            .select()
            .single();
          
          return {
            data: createdData,
            error,
            status: error ? 'error' : 'success'
          };
        },
        
        update: async (id, data) => {
          const supabase = getSupabaseBrowserClient();
          const { data: updatedData, error } = await supabase
            .from('specialist_patienten')
            .update(data)
            .eq('id', id)
            .select()
            .single();
          
          return {
            data: updatedData,
            error,
            status: error ? 'error' : 'success'
          };
        },
        
        delete: async (id) => {
          const supabase = getSupabaseBrowserClient();
          const { error } = await supabase
            .from('specialist_patienten')
            .delete()
            .eq('id', id);
          
          return {
            data: null,
            error,
            status: error ? 'error' : 'success'
          };
        }
      },
      
      // Raw query execution
      executeRawQuery,
      
      // Validation helper
      validate
    }
  };
}
