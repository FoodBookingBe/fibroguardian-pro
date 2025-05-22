
// Fix voor ontbrekende property 'addNotification' op Element type
declare module "react" {
  interface Element {
    addNotification?: unknown;
  }
}
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useMutation, useQueryClient, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'; // Added UseMutationResult

import { useNotification } from '@/context/NotificationContext'; // Import useNotification
import { ErrorMessage } from '@/lib/error-handler';
import { getSupabaseBrowserClient } from '@/lib/supabase-client'; // Added import
import { Task, Profile, TaskLog, Reflectie, SpecialistPatient, ReflectieFormData } from '@/types'; // Added ReflectieFormData

// Taak toevoegen/bijwerken
// TData is the type of data returned by the mutationFn on success (e.g., the updated/created task)
// TVariables is the type of variables passed to the mutationFn (e.g., Partial<Task>)
export function useUpsertTask(
  options?: Omit<UseMutationOptions<Task, ErrorMessage, Partial<Task>>, 'mutationFn'>
): UseMutationResult<Task, ErrorMessage, Partial<Task>> {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();
  
  return useMutation<Task, ErrorMessage, Partial<Task>>({
    mutationFn: async (task: Partial<Task>) => {
      const method = task.id ? 'PUT' : 'POST';
      const url = task.id ? `/api/tasks/${task.id}` : '/api/tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      
      const responseData = await response.json();
      if (!response.ok) {
        const err: ErrorMessage = {
            userMessage: responseData.error?.message || responseData.message || 'Er is een fout opgetreden bij het opslaan van de taak',
            technicalMessage: `Status: ${response.status}, Response: ${JSON.stringify(responseData)}`,
            // errorCode and action can be omitted or set to generic values if not available from API response
        };
        throw err; 
      }
      
      return responseData.data || responseData; // API might return { data: Task } or just Task
    },
    onSuccess: (data, variables: unknown) => {
      // Invalidate en refetch betreffende queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] }); 
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: ['task', variables.id] }); 
      }
      if (data?.user_id) { // If the task data includes user_id, invalidate tasks for that user
         queryClient.invalidateQueries({ queryKey: ['tasks', data.user_id] });
      }
      // Optionally, update the cache directly with setQueryData
      if (data?.id) {
        queryClient.setQueryData(['task', data.id], data);
      }
    },
    onError: (error: ErrorMessage, variables: unknown) => { 
      console.error(`Fout bij opslaan taak (ID: ${variables.id || 'new'}):`, error.userMessage, error.technicalMessage);
      addNotification({ type: 'error', message: error.userMessage || 'Opslaan van taak mislukt.' });
    },
    ...options,
  });
}

// Taak verwijderen
export function useDeleteTask(
  options?: Omit<UseMutationOptions<{ message: string }, ErrorMessage, string>, 'mutationFn'>
): UseMutationResult<{ message: string }, ErrorMessage, string> {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();
  
  return useMutation<{ message: string }, ErrorMessage, string>({ // TVariables is taskId (string)
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      
      const responseData = await response.json();
      if (!response.ok) {
        const err: ErrorMessage = {
            userMessage: responseData.error?.message || responseData.message || 'Er is een fout opgetreden bij het verwijderen van de taak',
            technicalMessage: `Status: ${response.status}, Response: ${JSON.stringify(responseData)}`,
        };
        throw err;
      }
      
      return responseData; // API returns { message: string }
    },
    onSuccess: (_data: unknown, taskId, _context) => { // data and context marked as unused
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.removeQueries({ queryKey: ['task', taskId] });
      // Potentially invalidate user-specific task list if applicable
      // const { user } = useAuth(); // This hook cannot be used here. Need userId from variables or context.
      // if (userId) queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
    },
    onError: (error: ErrorMessage, taskId) => {
      console.error(`Fout bij verwijderen taak (ID: ${taskId}):`, error.userMessage, error.technicalMessage);
      addNotification({ type: 'error', message: error.userMessage || 'Verwijderen van taak mislukt.' });
    },
    ...options,
  });
}

// Add other mutation hooks for other resources (reflecties, profiles, etc.) here.

// Profiel bijwerken
export function useUpdateProfile(
  options?: Omit<UseMutationOptions<Profile, ErrorMessage, { id: string; data: Partial<Profile> }>, 'mutationFn'>
): UseMutationResult<Profile, ErrorMessage, { id: string; data: Partial<Profile> }> {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();
  
  return useMutation<Profile, ErrorMessage, { id: string; data: Partial<Profile> }>({
    mutationFn: async ({ id, data }) => {
      const url = `/api/profiles/${id}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      if (!response.ok) {
        const err: ErrorMessage = {
            userMessage: responseData.error?.message || responseData.message || 'Er is een fout opgetreden bij het bijwerken van het profiel',
            technicalMessage: `Status: ${response.status}, Response: ${JSON.stringify(responseData)}`,
        };
        throw err;
      }
      return responseData as Profile; // API returns the updated profile
    },
    onSuccess: (updatedProfile, variables: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['profile', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] }); 
      
      queryClient.setQueryData(['profile', variables.id], updatedProfile);
      const currentMeProfile = queryClient.getQueryData(['profile', 'me']) as Profile | undefined;
      if (currentMeProfile && currentMeProfile.id === variables.id) {
        queryClient.setQueryData(['profile', 'me'], updatedProfile);
      }
    },
    onError: (error: ErrorMessage, variables: unknown) => { 
      console.error(`Fout bij bijwerken profiel (ID: ${variables.id}):`, error.userMessage, error.technicalMessage);
      addNotification({ type: 'error', message: error.userMessage || 'Bijwerken van profiel mislukt.' });
    },
    ...options,
  });
}

// Task Log Mutations

// Task Log toevoegen
export function useAddTaskLog(
  options?: Omit<UseMutationOptions<TaskLog, ErrorMessage, Partial<Omit<TaskLog, 'id' | 'created_at' | 'user_id'>> & { task_id: string; start_tijd: string }>, 'mutationFn'>
): UseMutationResult<TaskLog, ErrorMessage, Partial<Omit<TaskLog, 'id' | 'created_at' | 'user_id'>> & { task_id: string; start_tijd: string }> {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();
  
  return useMutation<TaskLog, ErrorMessage, Partial<Omit<TaskLog, 'id' | 'created_at' | 'user_id'>> & { task_id: string; start_tijd: string }>({
    mutationFn: async (logData: unknown) => {
      const response = await fetch('/api/task-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData),
      });
      
      const responseData = await response.json();
      if (!response.ok) {
        const err: ErrorMessage = {
            userMessage: responseData.error?.message || responseData.message || 'Er is een fout opgetreden bij het opslaan van de log',
            technicalMessage: `Status: ${response.status}, Response: ${JSON.stringify(responseData)}`,
        };
        throw err;
      }
      return responseData as TaskLog;
    },
    onSuccess: (data, variables: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['taskLogs', variables.task_id] });
      queryClient.invalidateQueries({ queryKey: ['recentLogs'] }); 
      if (data?.user_id) {
        queryClient.invalidateQueries({ queryKey: ['recentLogs', data.user_id] });
      }
    },
    onError: (error: ErrorMessage, variables: unknown) => { 
      console.error(`Fout bij opslaan taaklog voor taak ${variables.task_id}:`, error.userMessage, error.technicalMessage);
      addNotification({ type: 'error', message: error.userMessage || 'Opslaan van taaklog mislukt.' });
    },
    ...options,
  });
}

// Task Log bijwerken
export function useUpdateTaskLog(
  options?: Omit<UseMutationOptions<TaskLog, ErrorMessage, { id: string; data: Partial<TaskLog> }>, 'mutationFn'>
): UseMutationResult<TaskLog, ErrorMessage, { id: string; data: Partial<TaskLog> }> {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();
  
  return useMutation<TaskLog, ErrorMessage, { id: string; data: Partial<TaskLog> }>({
    mutationFn: async ({ id, data }) => {
      const url = `/api/task-logs/${id}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      if (!response.ok) {
        const err: ErrorMessage = {
            userMessage: responseData.error?.message || responseData.message || 'Er is een fout opgetreden bij het bijwerken van de log',
            technicalMessage: `Status: ${response.status}, Response: ${JSON.stringify(responseData)}`,
        };
        throw err;
      }
      return responseData as TaskLog;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['taskLogs', data.task_id] }); 
      queryClient.invalidateQueries({ queryKey: ['recentLogs', data.user_id] });
      queryClient.setQueryData(['taskLog', variables.id], data); 
    },
    onError: (error: ErrorMessage, variables) => { 
      console.error(`Fout bij bijwerken taaklog (ID: ${variables.id}):`, error.userMessage, error.technicalMessage);
      // Notification for this is already handled in TaskExecutionContainer's direct onError callback for updateTaskLog
      // However, adding it here provides a fallback if the component doesn't override onError.
      // For consistency, we can add it.
      addNotification({ type: 'error', message: error.userMessage || 'Bijwerken van taaklog mislukt.' });
    },
    ...options,
  });
}
 
// Reflectie Mutations
 
export function useUpsertReflectie(
  options?: Omit<UseMutationOptions<Reflectie, ErrorMessage, ReflectieFormData>, 'mutationFn'>
): UseMutationResult<Reflectie, ErrorMessage, ReflectieFormData> {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();
  
  return useMutation<Reflectie, ErrorMessage, ReflectieFormData>({
    mutationFn: async (reflectieData: ReflectieFormData) => { // Use ReflectieFormData for input
      // The API route POST /api/reflecties handles upsert logic based on user_id and datum.
      const url = '/api/reflecties';
      const response = await fetch(url, {
        method: 'POST', // POST handles upsert logic in the API route
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reflectieData),
      });
      
      const responseData = await response.json();
      if (!response.ok) {
        const err: ErrorMessage = {
            userMessage: responseData.error?.message || responseData.message || 'Er is een fout opgetreden bij het opslaan van de reflectie',
            technicalMessage: `Status: ${response.status}, Response: ${JSON.stringify(responseData)}`,
        };
        throw err;
      }
      return responseData as Reflectie;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reflecties', data.user_id] }); // Invalidate list for user
      queryClient.invalidateQueries({ queryKey: ['reflecties', data.user_id, variables.datum] }); // Invalidate specific date if key structure allows
      queryClient.setQueryData(['reflectie', data.id], data); // Update specific reflectie cache
    },
    onError: (error: ErrorMessage, variables) => { 
      console.error(`Fout bij opslaan reflectie (Datum: ${variables.datum}):`, error.userMessage, error.technicalMessage);
      addNotification({ type: 'error', message: error.userMessage || 'Opslaan van reflectie mislukt.' });
    },
    ...options,
  });
}

// Reflectie verwijderen
export function useDeleteReflectie(
  options?: Omit<UseMutationOptions<{ message: string }, ErrorMessage, { id: string; userId?: string }>, 'mutationFn'>
): UseMutationResult<{ message: string }, ErrorMessage, { id: string; userId?: string }> {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();
  
  return useMutation<{ message: string }, ErrorMessage, { id: string; userId?: string }>({
    mutationFn: async ({ id }) => {
      const response = await fetch(`/api/reflecties/${id}`, {
        method: 'DELETE',
      });
      
      const responseData = await response.json();
      if (!response.ok) {
        const err: ErrorMessage = {
            userMessage: responseData.error?.message || responseData.message || 'Er is een fout opgetreden bij het verwijderen van de reflectie',
            technicalMessage: `Status: ${response.status}, Response: ${JSON.stringify(responseData)}`,
        };
        throw err;
      }
      return responseData;
    },
    onSuccess: (_data: unknown, variables) => { // data marked as unused
      if (variables.userId) {
        queryClient.invalidateQueries({ queryKey: ['reflecties', variables.userId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['reflecties'] }); // More general invalidation
      }
      queryClient.removeQueries({ queryKey: ['reflectie', variables.id] });
    },
    onError: (error: ErrorMessage, variables) => { 
      console.error(`Fout bij verwijderen reflectie (ID: ${variables.id}):`, error.userMessage, error.technicalMessage);
      addNotification({ type: 'error', message: error.userMessage || 'Verwijderen van reflectie mislukt.' });
    },
    ...options,
  });
}

// Specialist-Patient Relationship Mutations

// Add Specialist-Patient Relationship
export function useAddSpecialistPatientRelation(
  options?: Omit<UseMutationOptions<SpecialistPatient, ErrorMessage, { patient_email?: string; specialist_id_to_add?: string }>, 'mutationFn'>
): UseMutationResult<SpecialistPatient, ErrorMessage, { patient_email?: string; specialist_id_to_add?: string }> {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();
  return useMutation<SpecialistPatient, ErrorMessage, { patient_email?: string; specialist_id_to_add?: string }>({
    mutationFn: async (variables) => {
      const response = await fetch('/api/specialist-patienten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variables),
      });
      const responseData = await response.json();
      if (!response.ok) {
        const err: ErrorMessage = {
          userMessage: responseData.error?.message || responseData.message || 'Fout bij toevoegen relatie.',
          technicalMessage: `Status: ${response.status}, Response: ${JSON.stringify(responseData)}`,
        };
        throw err;
      }
      return responseData as SpecialistPatient;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries, e.g., list of patients for a specialist or specialists for a patient
      if (variables.specialist_id_to_add) { // Patient added a specialist
        queryClient.invalidateQueries({ queryKey: ['mySpecialists', data.patient_id] });
      } else if (variables.patient_email) { // Specialist added a patient
        queryClient.invalidateQueries({ queryKey: ['myPatients', data.specialist_id] });
      }
    },
    onError: (error: ErrorMessage) => {
      console.error('Fout bij toevoegen specialist-patiënt relatie:', error.userMessage, error.technicalMessage);
      addNotification({ type: 'error', message: error.userMessage || 'Toevoegen van relatie mislukt.' });
    },
    ...options,
  });
}

// Delete Specialist-Patient Relationship
export function useDeleteSpecialistPatientRelation(
  options?: Omit<UseMutationOptions<{ message: string }, ErrorMessage, { relationshipId: string; currentUserId?: string }>, 'mutationFn'>
): UseMutationResult<{ message: string }, ErrorMessage, { relationshipId: string; currentUserId?: string }> {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();
  return useMutation<{ message: string }, ErrorMessage, { relationshipId: string; currentUserId?: string }>({
    mutationFn: async ({ relationshipId }) => {
      const response = await fetch(`/api/specialist-patienten/${relationshipId}`, {
        method: 'DELETE',
      });
      const responseData = await response.json();
      if (!response.ok) {
        const err: ErrorMessage = {
          userMessage: responseData.error?.message || responseData.message || 'Fout bij verwijderen relatie.',
          technicalMessage: `Status: ${response.status}, Response: ${JSON.stringify(responseData)}`,
        };
        throw err;
      }
      return responseData;
    },
    onSuccess: (_data: unknown, variables) => { // data marked as unused
      // Invalidate lists of patients and specialists for the affected users
      // This might require knowing both specialistId and patientId from the deleted relation,
      // or having the currentUserId to invalidate their specific list.
      queryClient.invalidateQueries({ queryKey: ['myPatients'] }); // Broad invalidation
      queryClient.invalidateQueries({ queryKey: ['mySpecialists'] }); // Broad invalidation
      if (variables.currentUserId) {
         // More specific invalidations if user type is known
         queryClient.invalidateQueries({ queryKey: ['myPatients', variables.currentUserId] }); 
         queryClient.invalidateQueries({ queryKey: ['mySpecialists', variables.currentUserId] });
      }
    },
    onError: (error: ErrorMessage, variables) => {
      console.error(`Fout bij verwijderen relatie (ID: ${variables.relationshipId}):`, error.userMessage, error.technicalMessage);
      addNotification({ type: 'error', message: error.userMessage || 'Verwijderen van relatie mislukt.' });
    },
    ...options,
  });
}
// Authentication Mutations

interface SignInVariables {
  email: string;
  password: string;
}

// Supabase signInWithPassword returns { data: { user: User; session: Session; }; error: AuthError | null }
// For simplicity, we'll type the success data (TData) as the user object, session handling is often implicit.
// Or more explicitly: interface SignInSuccessData { user: SupabaseUser; session: Session | null }
// Sticking to User for now, as session is managed by Supabase client.

export function useSignInEmailPassword(
  options?: Omit<UseMutationOptions<SupabaseUser, ErrorMessage, SignInVariables>, 'mutationFn'>
): UseMutationResult<SupabaseUser, ErrorMessage, SignInVariables> {
  const queryClient = useQueryClient();
  // const { addNotification } = useNotification(); // Notifications can be handled by the component or here

  return useMutation<SupabaseUser, ErrorMessage, SignInVariables>({
    mutationFn: async ({ email, password }) => {
      const supabase = getSupabaseBrowserClient(); // Defined in lib/supabase.ts
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw {
          userMessage: error.message || 'Fout bij inloggen.',
          technicalMessage: `Supabase signInError: ${error.message}`,
          httpStatus: error.status,
        } as ErrorMessage;
      }
      if (!data.user) {
        throw {
          userMessage: 'Inloggen mislukt, geen gebruiker data ontvangen.',
          technicalMessage: 'Supabase signIn did not return user data.',
        } as ErrorMessage;
      }
      return data.user;
    },
    onSuccess: (_user: unknown) => { // user marked as unused
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['user'] }); // General user query if used
      // addNotification({ type: 'success', message: 'Succesvol ingelogd!' });
      // Navigation is typically handled by the component after successful login
    },
    onError: (error: ErrorMessage) => {
      console.error('Fout bij inloggen (hook):', error.userMessage, error.technicalMessage);
      // addNotification({ type: 'error', message: error.userMessage || 'Inloggen mislukt.' });
    },
    ...options,
  });
}

interface SignUpOptionsData {
  voornaam: string;
  achternaam: string;
  type: 'patient' | 'specialist';
  [key: string]: unknown; // Replaced any with unknown
}

interface SignUpVariables {
  email: string;
  password: string;
  options?: {
    emailRedirectTo?: string;
    data?: SignUpOptionsData;
  };
}

// Supabase signUp returns { data: { user: User | null; session: Session | null; }; error: AuthError | null }
// TData can be { user: SupabaseUser | null }
interface SignUpSuccessData {
    user: SupabaseUser | null;
    // session: Session | null; // session is usually handled by Supabase client automatically
}

export function useSignUpWithEmailPassword(
  options?: Omit<UseMutationOptions<SignUpSuccessData, ErrorMessage, SignUpVariables>, 'mutationFn'>
): UseMutationResult<SignUpSuccessData, ErrorMessage, SignUpVariables> {
  // const { addNotification } = useNotification();

  return useMutation<SignUpSuccessData, ErrorMessage, SignUpVariables>({
    mutationFn: async ({ email, password, options: signUpOptions }) => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: signUpOptions,
      });

      if (error) {
        throw {
          userMessage: error.message || 'Fout bij registreren.',
          technicalMessage: `Supabase signUpError: ${error.message}`,
          httpStatus: error.status,
        } as ErrorMessage;
      }
      // data.user can be null if email confirmation is required.
      // data.session will also be null in that case.
      return { user: data.user }; 
    },
    onSuccess: (_data: unknown) => { // data marked as unused
      // if (data.user) {
        // addNotification({ type: 'success', message: 'Registratie succesvol! Controleer uw e-mail.' });
      // } else {
        // addNotification({ type: 'info', message: 'Registratie deels gelukt. Controleer uw e-mail voor bevestiging.' });
      // }
      // No specific query invalidation needed immediately on sign-up typically,
      // as user needs to confirm email. Profile is created via trigger.
    },
    onError: (error: ErrorMessage) => {
      console.error('Fout bij registreren (hook):', error.userMessage, error.technicalMessage);
      // addNotification({ type: 'error', message: error.userMessage || 'Registratie mislukt.' });
    },
    ...options,
  });
}
