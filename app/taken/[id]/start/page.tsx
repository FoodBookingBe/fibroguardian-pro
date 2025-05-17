'use client';
import { useState, useEffect } from 'react';
// 'use client' is not needed here if we remove client-side fetching from this page component
// import { useState, useEffect } from 'react'; // No longer needed for task fetching
import { useParams, useRouter } from 'next/navigation'; // useRouter might still be needed for onComplete
// import { getSupabaseBrowserClient } from '@/lib/supabase'; // No longer needed for task fetching
import TaskExecutionContainer from '@/containers/tasks/TaskExecutionContainer'; // Updated import
// import { Task } from '@/types'; // Task type might not be needed here if not passing initialTask
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout'; // Assuming this page uses DashboardLayout

// This page can become simpler as the container handles loading/error states for the task itself.
// We might still want a server-side auth check here.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';


export default async function TaskStartPage() {
  const params = useParams();
  const router = useRouter(); // Keep for onComplete, or pass onComplete from server component if possible
  const taskId = params.id as string;

  // Optional: Server-side auth check before rendering the page structure
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
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
  // Note: Access control (if this user can start this specific task)
  // would ideally be handled within TaskExecutionContainer or its data fetching logic.

  if (!taskId) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-xl font-semibold text-red-600 mb-4">Fout</h1>
            <p className="text-gray-700 mb-6">Geen taak ID gevonden.</p>
            <Link
              href="/taken"
              className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
            >
              Terug naar taken
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout> {/* Wrap with DashboardLayout */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/taken"
            className="text-purple-600 hover:text-purple-800 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Terug naar taken
          </Link>
        </div>
        
        <TaskExecutionContainer
          taskId={taskId}
          // onComplete can be handled within the container or passed differently if needed from server
        />
      </div>
    </DashboardLayout>
  );
} // Added missing closing bracket
