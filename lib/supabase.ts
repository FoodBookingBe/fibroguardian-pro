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
    // Voeg deze debug logging toe
    console.log("Creating new Supabase client instance (default cookie handling)");
    supabaseInstance = createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!);
    // Reverted to default cookie handling by removing the custom 'cookies' object.
    // The @supabase/ssr library's createBrowserClient is generally expected to handle
    // cookie operations correctly by default in a Next.js environment.
    // The "Failed to parse cookie string: SyntaxError: Unexpected token 'b', "base64-eyJ"..."
    // error suggests that the custom cookie 'get' method, or how cookies were being set,
    // might have been interfering with the expected format.
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
