// lib/supabase-client.ts
import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("lib/supabase-client.ts: Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("lib/supabase-client.ts: Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Singleton instance for the browser (using @supabase/ssr)
let browserClientInstance: SupabaseClient<Database> | null = null;

// For client components (using @supabase/ssr)
export const getSupabaseBrowserClient = (): SupabaseClient<Database> => {
  if (typeof window === 'undefined') {
    // This check is for runtime, the main issue was build time due to static import.
    // Separating files fixes the build error.
    throw new Error("getSupabaseBrowserClient was called on the server. It should only be called on the client side.");
  }
  if (!browserClientInstance) {
    try {
      console.log("[Supabase] Creating new Browser client instance (ssr) with URL:", supabaseUrl);
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("[Supabase] Missing environment variables for browser client.");
        throw new Error("Supabase URL or Anon Key is missing for browser client.");
      }
      browserClientInstance = createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!);
      console.log("[Supabase] Browser client instance (ssr) created successfully");
    } catch (err) {
      console.error("[Supabase] Error creating browser client (ssr):", err);
      throw err; // Re-throw the error
    }
  }
  return browserClientInstance;
};

// If createClientComponentClient from '@supabase/auth-helpers-nextjs' is still needed for other client components,
// it should be initialized and exported from this file.
// For example:
// import { createClientComponentClient as createOldClientComponentClient } from '@supabase/auth-helpers-nextjs';
// export const getLegacySupabaseClientComponentClient = () => {
//   return createOldClientComponentClient<Database>();
// };
