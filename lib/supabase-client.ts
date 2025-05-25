// lib/supabase-client.ts
import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

import { logger } from '@/lib/monitoring/logger';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// DEBUG: Log all environment variables for debugging
console.log('[Supabase Client] Environment variables check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING',
  keyPrefix: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'MISSING',
  nodeEnv: process.env.NODE_ENV,
  allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
});

// Check environment variables at initialization time
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = `CRITICAL: Missing Supabase environment variables. URL: ${!!supabaseUrl}, Key: ${!!supabaseAnonKey}`;
  console.error(errorMessage, {
    url: supabaseUrl,
    anonKey: supabaseAnonKey
  });
  throw new Error(errorMessage);
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
        fetch: (url, options) => {
          // Simplified fetch override: Pass through options directly.
          // This lets Supabase client fully control its headers.
          // We are temporarily removing the custom 'Cache-Control' header.
          // console.log("[SupabaseClient] Global fetch override called. Options received:", options); // Removed for cleaner logs
          const response = fetch(url, options);
          response.then(_res => { // Prefixed 'res' with an underscore
            // Log headers of the actual request made, if possible (difficult without intercepting)
            // For now, just confirm the override is hit.
          }).catch(err => {
            logger.error("[SupabaseClient] Error in global fetch override:", { error: err }); // Use logger
          });
          return response;
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
