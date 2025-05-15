import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
// import TaskForm from '@/components/tasks/TaskForm'; // Assuming a form component exists or will be created

export default async function NieuweTaakPage() {
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

  return (
    <div className="container mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-800">Nieuwe Taak Toevoegen</h1>
      </header>
      {/* <TaskForm userId={user.id} /> */}
      <p>Hier komt het formulier om een nieuwe taak toe te voegen.</p>
      <p>Veronderstelt dat er een component `TaskForm` bestaat of gemaakt zal worden.</p>
    </div>
  );
}