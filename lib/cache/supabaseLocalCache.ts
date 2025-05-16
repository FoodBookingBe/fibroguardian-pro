/**
 * Lokale cache laag voor Supabase requests
 * Verbetert performance en ondersteunt offline gebruiksmodus
 */

import localforage from 'localforage';
// Removed createClient from here, will use getSupabaseBrowserClient
import { SupabaseClient, PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js'; 
import { Database } from '@/types/database'; // Assuming Database types are correctly defined
import { getSupabaseBrowserClient } from '../supabase'; // Import the centralized browser client

// Setup localforage instance
const cacheStore = localforage.createInstance({ // Renamed to avoid conflict with 'cache' variable
  name: 'fibroguardian-app-cache', // More specific name
  version: 1.0,
  storeName: 'supabase_api_cache', // More specific store name
  description: 'Cache for Supabase API GET requests'
});

const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes default TTL

// Define which tables and specific queries might be cacheable.
// This is a simplified example; a more robust solution might involve more granular config.
const CACHEABLE_TABLES: readonly string[] = [ // Use readonly array
  'profiles', 'tasks', 'task_logs', 'reflecties', 'inzichten', 
  // Add other frequently read, less frequently updated tables
];

interface CacheEntry<T> {
  data: T;
  timestamp: number; // When the data was cached
  expiresAt: number;   // When the cache entry expires
}

// Define a type for the query object for better type safety
type SupabaseQuery = {
  method: 'select'; // For now, only caching select
  params: any[];    // Parameters passed to the select query
};

// Extended SupabaseClient type
export interface CachedSupabaseClient extends SupabaseClient<Database> {
  fromCacheFirst: <T = any>(
    table: string,
    // A function that receives the Supabase query builder and executes the query
    executeQueryFn: (builder: ReturnType<SupabaseClient<Database>['from']>) => Promise<PostgrestSingleResponse<T> | PostgrestResponse<T>>,
    options?: { ttl?: number; forceRefresh?: boolean; cacheKey?: string }
  ) => Promise<{ data: T | null; error: any; source: 'cache' | 'network'; timestamp?: number }>;
  invalidateCache: (tableOrKey?: string) => Promise<void>;
  getCacheStats: () => Promise<{ itemCount: number; keys: string[] }>;
}

const generateCacheKey = (table: string, customKey?: string, queryParams?: any): string => {
  if (customKey) return `cache:${table}:${customKey}`;
  // A more robust key generation might involve hashing the queryParams
  return `cache:${table}:${JSON.stringify(queryParams || 'all')}`;
};

export const createCachedSupabaseClient = (): CachedSupabaseClient => {
  // Get the browser client from the centralized lib/supabase.ts
  // This already handles URL/key checks and singleton instantiation for the browser.
  const supabase = getSupabaseBrowserClient(); 
  
  const fromCacheFirst = async <T = any>(
    table: string,
    executeQueryFn: (builder: ReturnType<typeof supabase['from']>) => Promise<PostgrestSingleResponse<T> | PostgrestResponse<T>>,
    options: { ttl?: number; forceRefresh?: boolean; cacheKey?: string } = {}
  ): Promise<{ data: T | null; error: any; source: 'cache' | 'network'; timestamp?: number }> => {
    
    if (typeof window === 'undefined' || !CACHEABLE_TABLES.includes(table) || options.forceRefresh) {
      // Server-side, non-cacheable table, or force refresh: always fetch from network
      const { data, error } = await executeQueryFn(supabase.from(table));
      return { data: data as T | null, error, source: 'network' };
    }

    // Use provided cacheKey or generate one (though executeQueryFn makes auto-generation tricky)
    // It's better if the caller provides a stable cacheKey based on the query.
    const cacheKey = options.cacheKey || generateCacheKey(table, undefined, {}); // Fallback key
    const ttl = options.ttl || DEFAULT_CACHE_TTL;
    
    try {
      const cachedEntry = await cacheStore.getItem<CacheEntry<T>>(cacheKey);
      if (cachedEntry && Date.now() < cachedEntry.expiresAt) {
        return { data: cachedEntry.data, error: null, source: 'cache', timestamp: cachedEntry.timestamp };
      }
    } catch (cacheReadError) {
      console.warn(`Cache read error for key "${cacheKey}":`, cacheReadError);
    }
    
    // Fetch from network
    const { data: networkData, error: networkError } = await executeQueryFn(supabase.from(table));
    
    if (!networkError && networkData !== null) { // Ensure networkData is not null
      try {
        await cacheStore.setItem<CacheEntry<T>>(cacheKey, {
          data: networkData as T, // Cast here
          timestamp: Date.now(),
          expiresAt: Date.now() + ttl,
        });
      } catch (cacheWriteError) {
        console.warn(`Cache write error for key "${cacheKey}":`, cacheWriteError);
      }
    }
    return { data: networkData as T | null, error: networkError, source: 'network' };
  };
  
  const invalidateCache = async (tableOrKey?: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    try {
      if (tableOrKey) {
        if (tableOrKey.startsWith('cache:')) { // If it's a full key
          await cacheStore.removeItem(tableOrKey);
        } else { // If it's a table name, invalidate all keys for that table
          const keys = await cacheStore.keys();
          const keysToRemove = keys.filter(key => key.startsWith(`cache:${tableOrKey}:`));
          await Promise.all(keysToRemove.map(key => cacheStore.removeItem(key)));
        }
      } else {
        await cacheStore.clear(); // Clear all cache
      }
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  };

  const getCacheStats = async (): Promise<{ itemCount: number; keys: string[] }> => {
    if (typeof window === 'undefined') return { itemCount: 0, keys: [] };
    const keys = await cacheStore.keys();
    return { itemCount: keys.length, keys };
  };
  
  return Object.assign(supabase, { fromCacheFirst, invalidateCache, getCacheStats });
};

// Singleton instance for client-side usage
export const cachedSupabase = typeof window !== 'undefined' ? createCachedSupabaseClient() : null;

// Example Usage (in a client component or useEffect):
/*
import { cachedSupabase } from '@/lib/cache/supabaseLocalCache';

async function fetchTasks(userId: string) {
  if (!cachedSupabase) return { data: null, error: new Error("Cache not available"), source: 'network'};

  return cachedSupabase.fromCacheFirst(
    'tasks',
    (builder) => builder.select('*').eq('user_id', userId).order('created_at'),
    { cacheKey: `tasks_user_${userId}`, ttl: 10 * 60 * 1000 } // 10 min TTL for tasks
  );
}

// To invalidate:
// await cachedSupabase?.invalidateCache('tasks'); // Invalidate all tasks
// await cachedSupabase?.invalidateCache(`cache:tasks:tasks_user_${userId}`); // Invalidate specific query
*/
