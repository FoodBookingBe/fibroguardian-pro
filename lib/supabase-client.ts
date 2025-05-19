// lib/supabase-client.ts
import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { logger } from '@/lib/monitoring/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Log the values being used by the client for debugging
console.log("[SupabaseClient] Attempting to initialize with URL:", supabaseUrl);
console.log("[SupabaseClient] Attempting to initialize with Anon Key:", supabaseAnonKey);

// Check environment variables at initialization time
if (!supabaseUrl || !supabaseAnonKey) {
  // Log an error to the server console as well if possible (though this is client-side)
  // and more importantly, to the browser console.
  const errorMessage = "CRITICAL: Missing Supabase environment variables in lib/supabase-client.ts. NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is undefined or empty when the client is being initialized.";
  console.error(errorMessage, {
    url: supabaseUrl, // Will show undefined if that's the issue
    anonKey: supabaseAnonKey // Will show undefined if that's the issue
  });
  // Throwing an error here will likely break client-side rendering,
  // which is good for visibility of this critical configuration issue.
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
        console.log("[SupabaseClient] Global fetch override called. Options received:", options);
        const response = fetch(url, options);
        response.then(res => {
          // Log headers of the actual request made, if possible (difficult without intercepting)
          // For now, just confirm the override is hit.
        }).catch(err => {
          console.error("[SupabaseClient] Error in global fetch override:", err);
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

/**
 * Reset the browser client instance
 * Useful for testing or when you need to force a new instance
 */
export const resetSupabaseBrowserClient = (): void => {
  browserClientInstance = null;
};
