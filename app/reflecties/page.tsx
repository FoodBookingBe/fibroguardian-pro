import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ReflectiesList from '@/components/reflecties/ReflectiesList';
import { Reflectie } from '@/types'; // Import type

export default async function ReflectiesPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // Middleware should handle redirecting unauthenticated users to login.
    redirect('/auth/login');
  }
  
  // Haal reflecties op
  const { data, error } = await supabase
    .from('reflecties')
    .select('*')
    .eq('user_id', user.id) // Use user.id
    .order('datum', { ascending: false }) // Show most recent first
    .limit(30); // Limit to a reasonable number for the list
  
  if (error) {
    console.error("Error fetching reflecties:", error);
    // Optionally, render an error message to the user
  }

  const reflecties: Reflectie[] = data || [];
  
  return (
    <div className="container mx-auto px-4 py-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-800">Mijn Reflecties</h1>
        <Link 
          href="/reflecties/nieuw" 
          className="btn-primary" // Using global style
        >
          Nieuwe Reflectie
        </Link>
      </header>
      
      <ReflectiesList reflecties={reflecties} />
    </div>
  );
}