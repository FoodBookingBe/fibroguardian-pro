// lib/supabase-client.ts
import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { logger } from '@/lib/monitoring/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check environment variables at initialization time
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables in lib/supabase-client.ts");
}

// Singleton instance for the browser
let browserClientInstance: SupabaseClient<Database> | null = null;

/**
 * Get or create a Supabase client for browser/client components
 * Uses a singleton pattern to avoid creating multiple instances
 * 
 * @returns A Supabase client instance for browser use
 */
export const getSupabaseBrowserClient = (): SupabaseClient<Database> => {
  // Ensure this is only called on the client side
  if (typeof window === 'undefined') {
    throw new Error("getSupabaseBrowserClient must only be called on the client side");
  }
  
  // Return existing instance if available
  if (browserClientInstance) {
    return browserClientInstance;
  }
  
  try {
    // Create a new client with optimized settings
    browserClientInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      global: {
        // Add fetch options for better performance
        fetch: (url, options) => {
          return fetch(url, {
            ...options,
            // Add cache control headers for better caching
            headers: {
              ...options?.headers,
              'Cache-Control': 'no-cache'
            }
          });
        }
      }
    });
    
    return browserClientInstance;
  } catch (error) {
    // Log the error using the centralized logger
    logger.error('Failed to initialize Supabase browser client', { error });
    throw error;
  }
};

/**
 * Reset the browser client instance
 * Useful for testing or when you need to force a new instance
 */
export const resetSupabaseBrowserClient = (): void => {
  browserClientInstance = null;
};
