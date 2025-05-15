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
    console.log("Creating new Supabase client instance");
    supabaseInstance = createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      // Explicieter cookie management
      cookies: {
        get(name) {
          const cookiePair = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`));
          const cookieValue = cookiePair ? cookiePair.split('=')[1] : undefined;
          console.log(`[Supabase Cookies GET] Name: ${name}, Raw Value: ${cookieValue}`);
          return cookieValue;
        },
        set(name, value, options) {
          // Voeg SameSite en andere attributen toe
          let cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 7}`;
          if (options.domain) cookie += `; domain=${options.domain}`;
          if (options.maxAge) cookie += `; max-age=${options.maxAge}`;
          if (options.secure) cookie += '; secure';
          if (options.sameSite) cookie += `; samesite=${options.sameSite}`;
          document.cookie = cookie;
        },
        remove(name, options) {
          const cookieString = `${name}=; path=/; max-age=0`;
          // if (options.domain) cookieString += `; domain=${options.domain}`; // domain not typically needed for removal by path
          document.cookie = cookieString;
        },
      },
    });
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
