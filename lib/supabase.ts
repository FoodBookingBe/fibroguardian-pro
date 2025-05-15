import { createBrowserClient, SupabaseClient } from '@supabase/ssr'; // Changed import source
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
    // Throw an error or return a mock/dummy client if necessary,
    // but throwing makes misuse explicit.
    throw new Error("getSupabaseBrowserClient was called on the server. It should only be called on the client side.");
  }

  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!);
  }
  // We are sure supabaseInstance is non-null here due to the logic above
  // and the check for window !== 'undefined'.
  return supabaseInstance!; // Added non-null assertion
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
