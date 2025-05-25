
import { getSupabaseServerComponentClient } from '@/lib/supabase-server'; // Updated import

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching

export default async function AuthTestPage() {
  const supabase = getSupabaseServerComponentClient(); // Use the new standardized client

  // Controleer of gebruiker is ingelogd
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();

  // Fetch profile if user exists
  let profile = null;
  if (user && !getUserError) {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (profileError) {
      console.error('Error fetching profile in AuthTestPage:', profileError);
    } else {
      profile = profileData;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test Page</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">User & Profile Status</h2>

        {getUserError ? (
          <p className="text-red-600 font-medium">Error fetching user: {getUserError.message}</p>
        ) : user ? (
          <div>
            <p className="text-green-600 font-medium mb-2">✅ Authenticated User</p>
            <h3 className="text-lg font-semibold mt-4 mb-2">User Details:</h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
              {JSON.stringify(user, null, 2)}
            </pre>
            <h3 className="text-lg font-semibold mt-4 mb-2">Profile Details:</h3>
            {profile ? (
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
                {JSON.stringify(profile, null, 2)}
              </pre>
            ) : (
              <p className="text-orange-500">Profile not found or error fetching profile.</p>
            )}
          </div>
        ) : (
          <p className="text-red-600 font-medium">❌ Not authenticated</p>
        )}
      </div>
    </div>
  );
}
