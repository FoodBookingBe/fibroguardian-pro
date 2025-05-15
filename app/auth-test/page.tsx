import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching

export default async function AuthTestPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Controleer of gebruiker is ingelogd
  const { data: { session } } = await supabase.auth.getSession();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test Page</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Session Status</h2>
        
        {session ? (
          <div>
            <p className="text-green-600 font-medium mb-2">✅ Authenticated</p>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-red-600 font-medium">❌ Not authenticated</p>
        )}
      </div>
    </div>
  );
}
