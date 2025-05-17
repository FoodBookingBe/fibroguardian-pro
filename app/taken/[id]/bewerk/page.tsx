// app/taken/[id]/bewerk/page.tsx
import DashboardLayout from '@/components/layout/DashboardLayout';
import TaskFormContainer from '@/containers/tasks/TaskFormContainer';
// Server-side auth check can remain if desired, or be fully handled by client components + middleware
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface BewerkTaakPageProps {
  params: {
    id: string;
  };
}

// This page component can be simplified as TaskFormContainer now handles data fetching
export default async function BewerkTaakPage({ params }: BewerkTaakPageProps) {
  const taskId = params.id;
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // Set and remove are not strictly necessary for read-only operations like getUser
        // but included for completeness if other auth actions were performed here.
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }
  
  // The TaskFormContainer will now fetch the task data using the taskId.
  // No need to fetch it here and pass as initialData unless there's a specific SSR need
  // that the client-side fetching in the container doesn't cover.
  // For simplicity and to align with container pattern, let container handle it.

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-800">Taak Bewerken</h1>
        </header>
        <TaskFormContainer taskId={taskId} isEditing={true} />
        {/* The note about TaskForm adaptation is no longer relevant as TaskFormContainer handles this */}
      </div>
    </DashboardLayout>
  );
}
