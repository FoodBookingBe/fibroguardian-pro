// lib/supabase-server.ts
import { createServerClient as createSSRServerClient, type CookieOptions } from '@supabase/ssr';
// import { SupabaseClient } from '@supabase/supabase-js'; // Unused
import { Database } from '@/types/database';
import { cookies } from 'next/headers'; // For server-side client

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("lib/supabase-server.ts: Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("lib/supabase-server.ts: Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

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
