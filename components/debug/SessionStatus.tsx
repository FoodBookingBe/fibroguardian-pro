'use client';

import { _useAuth as useAuth } from '@/components/auth/AuthProvider'; // Import useAuth

export default function SessionStatus(): JSX.Element {
  const { user, session, loading, profile } = useAuth();

  let statusMessage = 'Laden...';

  if (!loading) {
    if (session && user) {
      statusMessage = `Actieve sessie: ${user.email} (Type: ${profile?.type || 'onbekend'})`;
    } else if (session && !user) {
      statusMessage = 'Sessie gevonden, maar geen user object. Controleer Supabase logs.';
    }
    else {
      statusMessage = 'Geen actieve sessie gevonden.';
    }
  }

  return (
    <div className="p-2 bg-gray-100 text-sm text-gray-700 rounded mb-4">
      <strong>Session Debug:</strong> {statusMessage}
      {loading && <span className="italic ml-1">(Auth context laden...)</span>}
      {/* {profile && <pre className="mt-1 text-xs bg-gray-200 p-1 rounded overflow-x-auto">Profile: {JSON.stringify(profile, null, 2)}</pre>} */}
    </div>
  );
}
