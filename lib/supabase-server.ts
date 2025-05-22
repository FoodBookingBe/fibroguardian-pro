// lib/supabase-server.ts
import { type CookieOptions, createServerClient as createSSRServerClient } from '@supabase/ssr'; // createGenericClient removed as it's unused
import { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

import { logger } from '@/lib/monitoring/logger';
import { Database } from '@/types/database';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const _supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing required Supabase environment variables in lib/supabase-server.ts");
}

// Cache for server component clients to improve performance
const serverClientCache = new Map<string, SupabaseClient<Database>>();

/**
 * Get a Supabase client for use in Server Components
 * 
 * @returns A Supabase client configured for server components
 */
export const _getSupabaseServerComponentClient = (): SupabaseClient<Database> => {
  try {
    const cookieStore = cookies();
    const cookieString = cookieStore.getAll()
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');
    
    // Use cookie string as cache key to reuse clients with the same auth context
    const cacheKey = `server-component-${cookieString}`;
    
    if (serverClientCache.has(cacheKey)) {
      return serverClientCache.get(cacheKey)!;
    }
    
    const client = createSSRServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(_name: string, _value: string, _options: CookieOptions) {
            // Server Components cannot set cookies
          },
          remove(_name: string, _options: CookieOptions) {
            // Server Components cannot remove cookies
          },
        },
        auth: {
          autoRefreshToken: false, // Server components don't need to refresh tokens
          persistSession: false,   // Server components don't persist sessions
        },
        global: {
          // Add request timeout for better reliability
          fetch: (url, options) => {
            return fetch(url, {
              ...options,
              signal: AbortSignal.timeout(10000), // 10 second timeout
            });
          }
        }
      }
    );
    
    // Cache the client for future requests with the same cookies
    serverClientCache.set(cacheKey, client);
    return client;
  } catch (error) {
    logger.error('Failed to initialize Supabase server component client', { error });
    throw error;
  }
};

/**
 * Get a Supabase client for use in Route Handlers and Middleware
 * This client can set and remove cookies
 * 
 * @returns A Supabase client configured for route handlers
 */
export const _getSupabaseRouteHandlerClient = (): SupabaseClient<Database> => {
  try {
    const cookieStore = cookies();
    
    return createSSRServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options} // Type assertion fixed
const typedOptions = options as Record<string, unknown> ;);
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options} // Type assertion fixed
const typedOptions = options as Record<string, unknown> ;);
          },
        },
        global: {
          // Add request timeout for better reliability
          fetch: (url, options) => {
            return fetch(url, {
              ...options,
              signal: AbortSignal.timeout(10000), // 10 second timeout
            });
          }
        }
      }
    );
  } catch (error) {
    logger.error('Failed to initialize Supabase route handler client', { error });
    throw error;
  }
};
