// app/admin/users/page.tsx
import { getSupabaseServerComponentClient } from '@/lib/supabase-server';
import AdminUsersList from '@/components/admin/AdminUsersList';
import { Profile } from '@/types'; // Ensure Profile type is available

export const dynamic = 'force-dynamic'; // Ensures fresh data on each request

export default async function AdminUsersPage() {
  const supabase = getSupabaseServerComponentClient();
  let users: Profile[] = [];
  let fetchError: string | null = null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching users for admin page:", error);
      fetchError = error.message;
    } else {
      users = data || [];
    }
  } catch (e: any) {
    console.error("Unexpected error fetching users:", e);
    fetchError = e.message || "An unexpected error occurred.";
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gebruikersbeheer</h1>
        <button
          // onClick={() => {/* TODO: Open Add User Modal or Navigate */}}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Nieuwe Gebruiker Toevoegen
        </button>
      </div>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        {fetchError && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
            <span className="font-medium">Fout bij ophalen gebruikers:</span> {fetchError}
          </div>
        )}
        {/* TODO: Implement UserFilterControls */}
        {/* <UserFilterControls /> */}
        <AdminUsersList users={users} />
      </div>
    </div>
  );
}
