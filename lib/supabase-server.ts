// lib/supabase-server.ts
import { createServerClient as createSSRServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createGenericClient, SupabaseClient } from '@supabase/supabase-js'; // Added createClient and SupabaseClient
import { Database } from '@/types/database';
import { cookies } from 'next/headers'; // For server-side client

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("lib/supabase-server.ts: Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("lib/supabase-server.ts: Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
// Service role key is only needed for admin client, so check can be more specific
// if (!supabaseServiceRoleKey) {
//   throw new Error("lib/supabase-server.ts: Missing env.SUPABASE_SERVICE_ROLE_KEY (needed for admin client)");
// }


// For Server Components (App Router - using @supabase/ssr)
export const getSupabaseServerComponentClient = () => {
  console.log("[Supabase] Creating/getting Supabase Server Component client (ssr)");
  const cookieStore = cookies();
  return createSSRServerClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(_name: string, _value: string, _options: CookieOptions) { // Prefixed unused params
          // Server Components should not set cookies directly.
          // This is primarily for Route Handlers or Middleware.
          console.warn("[Supabase] Attempted to set cookie from Server Component client. This should ideally happen in Route Handlers or Middleware.");
          // cookieStore.set({ name, value, ...options }); // Avoid if not in a context that can set cookies
        },
        remove(_name: string, _options: CookieOptions) { // Prefixed unused params
          console.warn("[Supabase] Attempted to remove cookie from Server Component client.");
          // cookieStore.set({ name, value: '', ...options }); // Avoid
        },
      },
    }
  );
};

// For Route Handlers (App Router - using @supabase/ssr)
// And for Middleware (using @supabase/ssr)
export const getSupabaseRouteHandlerClient = () => {
  console.log("[Supabase] Creating/getting Supabase Route Handler/Middleware client (ssr)");
  const cookieStore = cookies();
  return createSSRServerClient<Database>( // Using the same ssr server client
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
};

// --- Legacy/Alternative Clients (if still needed for specific parts) ---
// If createClientComponentClient from '@supabase/auth-helpers-nextjs' is still needed for server components,
// it should be initialized and exported from this file, ensuring it's used correctly in a server context.
// For example:
// import { createServerComponentClient as createOldServerComponentClient } from '@supabase/auth-helpers-nextjs';
// export const getLegacySupabaseServerComponentClient = () => {
//   console.log("[Supabase] Creating/getting Legacy Supabase Server Component client (auth-helpers)");
//   const cookieStore = cookies();
//   return createOldServerComponentClient<Database>({ cookies: () => cookieStore });
// };

// For Admin operations (e.g., in Route Handlers, requiring service_role key)
// This client bypasses RLS. Use with extreme caution.
export const createSupabaseAdminClient = (): SupabaseClient<Database> => {
  if (!supabaseServiceRoleKey) {
    throw new Error("lib/supabase-server.ts: Missing env.SUPABASE_SERVICE_ROLE_KEY (needed for admin client)");
  }
  console.log("[Supabase] Creating Supabase Admin client (service_role)");
  // Uses the generic createClient, not the SSR-specific one, as admin operations are not typically tied to user sessions/cookies.
  return createGenericClient<Database>(supabaseUrl!, supabaseServiceRoleKey!, {
    auth: {
      // autoRefreshToken: false, // Admin client typically doesn't need to refresh tokens
      // persistSession: false, // Admin client doesn't manage sessions
    },
  });
};
