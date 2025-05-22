import React from 'react';

// app/admin/users/page.tsx
import { getSupabaseServerComponentClient } from '@/lib/supabase-server';
// AdminUsersList and UserManagementControls are now part of UsersPageClientView
import UsersPageClientView from '@/components/admin/UsersPageClientView'; 
import { Profile } from '@/types'; 

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
  } catch (e: unknown) {
    console.error("Unexpected error fetching users:", e);
    fetchError = e.message || "An unexpected error occurred.";
  }

  return (
    // UsersPageClientView will handle the layout of controls and the list
    <UsersPageClientView initialUsers={users} fetchError={fetchError} />
  );
}
