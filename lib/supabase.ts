import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("lib/supabase.ts: Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("lib/supabase.ts: Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Singleton instance for the browser
let supabaseInstance: SupabaseClient<Database> | null = null;

export const getSupabaseBrowserClient = (): SupabaseClient<Database> => {
  if (typeof window === 'undefined') {
    // This function should only be called on the client side.
    throw new Error("getSupabaseBrowserClient was called on the server. It should only be called on the client side.");
  }

  if (!supabaseInstance) {
    try {
      // Enhanced debug logging
      console.log("[Supabase] Creating new Supabase client instance with URL:", supabaseUrl);
      
      // Check if environment variables are properly loaded
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("[Supabase] Missing environment variables:", { 
          hasUrl: !!supabaseUrl, 
          hasAnonKey: !!supabaseAnonKey 
        });
      }
      
      supabaseInstance = createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!);
      console.log("[Supabase] Client instance created successfully");
      
      // Test the client with a simple auth check
      supabaseInstance.auth.getSession().then(({ data, error }) => {
        if (error) {
          console.error("[Supabase] Error testing client:", error.message);
        } else {
          console.log("[Supabase] Client test successful, session:", { 
            hasSession: !!data.session,
            hasUser: !!data.session?.user
          });
        }
      });
    } catch (err) {
      console.error("[Supabase] Error creating client:", err);
      throw err; // Re-throw to make errors visible
    }
  }
  return supabaseInstance!;
};

// Example for future server-side client (using @supabase/ssr):
// import { createServerClient, type CookieOptions } from '@supabase/ssr'
// import { cookies } from 'next/headers'
//
// export const getSupabaseServerComponentClient = () => {
//   const cookieStore = cookies()
//   return createServerClient<Database>(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         get(name: string) {
//           return cookieStore.get(name)?.value
//         },
//       },
//     }
//   )
// }
