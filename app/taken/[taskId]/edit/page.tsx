
// Pad wordt: app/taken/[taskId]/edit/page.tsx
import DashboardLayout from '@/components/layout/DashboardLayout';
import TaskFormContainer from '@/containers/tasks/TaskFormContainer';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface EditTaskPageProps { // Aangepaste interface naam
  params: {
    taskId: string; // Aangepast naar taskId
  };
}

export default async function EditTaskPage({ params }: EditTaskPageProps) { // Aangepaste functie naam
  const currentTaskId = params.taskId; // Gebruik currentTaskId
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: unknown) {
          cookieStore.set({ name, value, ...options as Record<string, unknown> });
        },
        remove(name: string, options: unknown) {
          cookieStore.set({ name, value: '', ...options as Record<string, unknown>, maxAge: 0 });
        },
      },
    }
  );

  console.log(`[EditTaskPage] Attempting to render for taskId: ${currentTaskId}`);

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error("[EditTaskPage] Auth error:", authError);
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <p>Authenticatie fout: {authError.message}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!authData.user) {
    console.log("[EditTaskPage] User not authenticated, redirecting to login.");
    redirect('/auth/login');
  }

  console.log(`[EditTaskPage] User ${authData.user.id} authenticated. Rendering TaskFormContainer for taskId: ${currentTaskId}`);

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-800">Taak Bewerken</h1>
        </header>
        <TaskFormContainer taskId={currentTaskId} isEditing={true} />
      </div>
    </DashboardLayout>
  );
}
