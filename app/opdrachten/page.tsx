import React from 'react';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import TaskList from '@/components/tasks/TaskList';
import { ErrorMessage, handleSupabaseError } from '@/lib/error-handler';
import { Task } from '@/types';

export default async function OpdrachtenPage(): Promise<JSX.Element> {
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

  let tasks: Task[] | null = null;
  let isLoading = true;
  let isError = false;
  let error: ErrorMessage | null = null;

  try {
    const { data, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw handleSupabaseError(fetchError, 'opdrachten-pagina-fetch');
    }
    tasks = data;
  } catch (err: unknown) {
    isError = true;
    error = handleSupabaseError(err, 'opdrachten-pagina-catch');
  } finally {
    isLoading = false;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-purple-800">Mijn Opdrachten</h1>
        <Link href="/opdrachten/nieuw" className="btn-primary">
          Nieuwe Opdracht
        </Link>
      </header>
      <TaskList tasks={tasks} isLoading={isLoading} isError={isError} error={error} />
    </div>
  );
}
