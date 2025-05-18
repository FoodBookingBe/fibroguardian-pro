import { redirect } from 'next/navigation';
import { getSupabaseServerComponentClient } from '@/lib/supabase-server'; // Corrected path
import AdminSidebar from '@/components/admin/AdminSidebar'; // Corrected path
import { ReactNode } from 'react';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = getSupabaseServerComponentClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/auth/login');
    // return null; // redirect() throws an error, so this is unreachable
  }
  
  // Fetch profile to check admin status
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('type')
    .eq('id', user.id)
    .single();
  
  // Redirect if not admin or profile error
  if (profileError || profile?.type !== 'admin') {
    // Log the error or profile type for debugging if needed
    if (profileError) console.error('[AdminLayout] Profile fetch error:', profileError.message);
    else console.warn(`[AdminLayout] User ${user.id} is not admin. Profile type: ${profile?.type}`);
    redirect('/dashboard'); // Redirect to a general dashboard or an "unauthorized" page
    // return null; 
  }
  
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900"> {/* Added dark mode bg */}
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8"> {/* Added responsive padding */}
        {children}
      </main>
    </div>
  );
}
