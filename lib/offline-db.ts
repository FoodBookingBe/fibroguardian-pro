import Dexie, { Table } from 'dexie';
import { Task, TaskLog, Reflectie } from '@/types'; // Assuming base types are defined
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'; // For online data fetching
import { useState, useEffect, useMemo } from 'react';
import { getSupabaseBrowserClient } from './supabase'; // For fetching tasks from Supabase

// Define interfaces for Dexie tables, extending base types with sync metadata
export interface TaskWithMeta extends Task {
  synced?: boolean; // True if synced with backend, false or undefined if local/modified
  local_updated_at?: number; // Timestamp of last local update
}
export interface TaskLogWithMeta extends TaskLog {
  synced?: boolean;
  local_updated_at?: number;
}
export interface ReflectieWithMeta extends Reflectie {
  synced?: boolean;
  local_updated_at?: number;
}
export interface PendingMutation {
  id?: number; // Auto-incremented primary key
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  body?: any;
  timestamp: number;
  retries: number;
  userId?: string; // To associate mutation with a user
}

class FibroGuardianOfflineDB extends Dexie {
  tasks!: Table<TaskWithMeta, string>; // string is the type of 'id' (primary key)
  task_logs!: Table<TaskLogWithMeta, string>; // Renamed to match table name convention
  reflecties!: Table<ReflectieWithMeta, string>;
  pendingMutations!: Table<PendingMutation, number>; // number is the type of 'id' (primary key)

  constructor() {
    super('FibroGuardianOfflineDB');
    
    this.version(1).stores({
      // Added 'synced' and 'local_updated_at' for optimistic updates and conflict resolution
      // 'user_id' is good for querying user-specific data offline
      tasks: '++id, user_id, type, due_date, created_at, synced, local_updated_at', 
      task_logs: '++id, task_id, user_id, start_tijd, synced, local_updated_at',
      reflecties: '++id, user_id, datum, synced, local_updated_at',
      pendingMutations: '++id, timestamp, userId', // Indexed for querying by user or time
    });
  }
}

export const offlineDB = new FibroGuardianOfflineDB();

// Helper function to fetch tasks from Supabase (example)
// This would typically reside in a service or within the useSupabaseQuery hook's queryFn
async function fetchTasksFromSupabase(userId: string | undefined): Promise<Task[]> {
  if (!userId) return [];
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetching tasks from Supabase:", error);
    throw error; // Re-throw to be caught by React Query
  }
  return data || [];
}


// Voorbeeld van een hook die zowel online als offline data gebruikt
// Dit is een vereenvoudigd voorbeeld. Een robuuste implementatie vereist meer
// logica voor conflict resolutie, data merging, en het triggeren van syncs.
export function useOfflineAwareTasks(userId: string | undefined) {
  // Online data via React Query
  const { 
    data: onlineTasksData, 
    isLoading: isLoadingOnline, 
    error: onlineError 
  } = useSupabaseQuery<Task[]>( // Specify type for useSupabaseQuery
    ['tasks', userId], 
    () => fetchTasksFromSupabase(userId),
    { enabled: !!userId } // Only fetch if userId is available
  );
  
  const [offlineTasks, setOfflineTasks] = useState<TaskWithMeta[]>([]);
  const [isLoadingOffline, setIsLoadingOffline] = useState(true);
  
  // Haal offline taken op en abonneer op wijzigingen
  useEffect(() => {
    if (!userId) {
      setOfflineTasks([]);
      setIsLoadingOffline(false);
      return;
    }

    setIsLoadingOffline(true);
    const fetchAndSubscribe = async () => {
      try {
        const tasksFromDB = await offlineDB.tasks
          .where('user_id')
          .equals(userId)
          .toArray();
        setOfflineTasks(tasksFromDB);
      } catch (err) {
        console.error('Error loading offline tasks:', err);
      } finally {
        setIsLoadingOffline(false);
      }
    };
    
    fetchAndSubscribe();

    // Optioneel: Live updates van Dexie (als je dat nodig hebt)
    // Dit vereist dat je Dexie.liveQuery gebruikt of een eigen event systeem opzet.
    // Voor nu, een simpele fetch bij mount/userId change.
    // offlineDB.tasks.where('user_id').equals(userId).toArray().then(setOfflineTasks);
    // const subscription = offlineDB.tasks.where('user_id').equals(userId)
    //   .subscribe(liveTasks => setOfflineTasks(liveTasks));
    // return () => subscription.unsubscribe();

  }, [userId]);
  
  // Combineer online en offline taken
  const mergedTasks = useMemo(() => {
    const onlineTasks: TaskWithMeta[] = (onlineTasksData || []).map(task => ({ ...task, synced: true }));
    
    const tasksMap = new Map<string, TaskWithMeta>();
    
    // Voeg eerst online taken toe (of de gecachte versie van React Query)
    onlineTasks.forEach(task => {
      tasksMap.set(task.id, task);
    });
    
    // Overschrijf/voeg offline taken toe, geef prioriteit aan lokaal gewijzigde data
    offlineTasks.forEach(task => {
      const existingTask = tasksMap.get(task.id);
      if (!existingTask || (task.local_updated_at && existingTask.updated_at && new Date(task.local_updated_at) > new Date(existingTask.updated_at)) || !task.synced) {
        // Als offline nieuwer is, of lokaal (nog niet gesynced), gebruik offline versie
        tasksMap.set(task.id, task);
      }
    });
    
    return Array.from(tasksMap.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [onlineTasksData, offlineTasks]);
  
  const isLoading = isLoadingOnline || (isLoadingOffline && !onlineTasksData); // Verfijnde loading state
  
  return { data: mergedTasks, isLoading, error: onlineError };
}

// TODO: Implement functions for adding/updating/deleting tasks that write to Dexie
// and queue mutations for syncing with Supabase.

// Example: Add a task (writes to Dexie, then queues for Supabase)
export async function addOfflineTask(taskData: Omit<TaskWithMeta, 'id' | 'created_at' | 'updated_at'> & { userId: string }) {
  const now = new Date();
  const newTask: TaskWithMeta = {
    ...taskData,
    id: crypto.randomUUID(), // Generate local UUID
    created_at: now, // Store as Date object
    updated_at: now, // Store as Date object
    user_id: taskData.userId, // Ensure user_id is set
    synced: false,
    local_updated_at: Date.now(),
  };
  await offlineDB.tasks.add(newTask);
  // TODO: Queue this as a POST request to /api/tasks using pendingMutations table or BackgroundSync
  console.log('Task added to offline DB, needs sync:', newTask);
  return newTask;
}
