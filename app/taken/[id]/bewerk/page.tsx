// app/taken/[id]/bewerk/page.tsx
import DashboardLayout from '@/components/layout/DashboardLayout';
import TaskForm from '@/components/tasks/TaskForm'; // Assuming TaskForm can be adapted for editing
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface BewerkTaakPageProps {
  params: {
    id: string;
  };
}

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
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch the existing task data
  const { data: task, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .eq('user_id', user.id) // Ensure user owns the task
    .single();

  if (error || !task) {
    console.error('Error fetching task for editing or task not found:', error);
    // redirect('/taken'); // Or show a not found message
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-xl font-semibold">Taak niet gevonden of fout bij ophalen</h1>
          <p>De taak met ID {taskId} kon niet worden geladen om te bewerken.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-800">Taak Bewerken</h1>
        </header>
        {/* Pass the fetched task data to TaskForm for editing */}
        {/* TaskForm will need to be adapted to handle initialData and update logic */}
        <TaskForm initialData={task} isEditing={true} taskId={taskId} />
        <p className="mt-4 text-sm text-gray-600">
          Opmerking: Het <pre className="inline bg-gray-100 p-1 rounded">TaskForm</pre> component moet worden aangepast om bestaande taakdata te accepteren en een update-operatie uit te voeren.
        </p>
      </div>
    </DashboardLayout>
  );
}
