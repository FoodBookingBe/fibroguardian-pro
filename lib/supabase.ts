import { createBrowserClient, createServerClient as createSSRServerClient, type CookieOptions } from '@supabase/ssr';
import { createClientComponentClient as createOldClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Keep for existing server components if needed
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { cookies } from 'next/headers'; // For server-side client

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("lib/supabase.ts: Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("lib/supabase.ts: Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Singleton instance for the browser (using @supabase/ssr)
let browserClientInstance: SupabaseClient<Database> | null = null;

// For client components (using @supabase/ssr)
export const getSupabaseBrowserClient = (): SupabaseClient<Database> => {
  if (typeof window === 'undefined') {
    throw new Error("getSupabaseBrowserClient was called on the server. It should only be called on the client side.");
  }
  if (!browserClientInstance) {
    try {
      console.log("[Supabase] Creating new Browser client instance (ssr) with URL:", supabaseUrl);
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("[Supabase] Missing environment variables for browser client.");
      }
      browserClientInstance = createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!);
      console.log("[Supabase] Browser client instance (ssr) created successfully");
    } catch (err) {
      console.error("[Supabase] Error creating browser client (ssr):", err);
      throw err;
    }
  }
  return browserClientInstance;
};

// For Server Components (App Router - using @supabase/ssr)
// This is the recommended way for new Server Components.
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
        set(name: string, value: string, options: CookieOptions) {
          // Server Components should not set cookies directly.
          // This is primarily for Route Handlers or Middleware.
          // For Server Components, this might be a no-op or log a warning.
          console.warn("[Supabase] Attempted to set cookie from Server Component client. This should ideally happen in Route Handlers or Middleware.");
          // cookieStore.set({ name, value, ...options }); // Avoid if not in a context that can set cookies
        },
        remove(name: string, options: CookieOptions) {
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
 
// For older Server Components (e.g. if still using @supabase/auth-helpers-nextjs directly)
// This was the typical way with `createServerComponentClient` from `@supabase/auth-helpers-nextjs`
// It's kept here if some parts of the app still rely on it, but migration to @supabase/ssr is preferred.
// export const getLegacySupabaseServerComponentClient = () => {
//   console.log("[Supabase] Creating/getting Legacy Supabase Server Component client (auth-helpers)");
//   // createOldClientComponentClient from @supabase/auth-helpers-nextjs handles cookies implicitly
//   // when used in Server Components, or expects a specific cookie store for Route Handlers.
//   // For Server Components, it's often used without explicit cookie handling passed here,
//   // relying on the Next.js context. If this is for a Route Handler context,
//   // it would need the { cookies } from next/headers passed differently.
//   // Given the original setup likely used it in Server Components, omitting explicit cookies
//   // might be the intended way for it to pick up Next.js's cookie context.
//   // If issues persist, this specific client might need to be replaced with getSupabaseServerComponentClient (ssr).
//   return createOldClientComponentClient<Database>();
// };
