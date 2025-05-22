import React from 'react';

'use client';
// import { useState, useEffect } from 'react'; // Unused imports
import { useParams } from 'next/navigation'; // useRouter removed as it's unused
// import { getSupabaseBrowserClient } from '@/lib/supabase'; // No longer needed for task fetching
import TaskExecutionContainer from '@/containers/tasks/TaskExecutionContainer'; // Updated import
// import { Task } from '@/types'; // Task type might not be needed here if not passing initialTask
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout'; // Assuming this page uses DashboardLayout

// This page can become simpler as the container handles loading/error states for the task itself.
// Server-side auth check is removed as this is a client component.
// Middleware and AuthProvider should handle auth.
// import { createServerClient } from '@supabase/ssr'; // Server-side
// import { cookies } from 'next/headers'; // Server-side
// import { redirect } from 'next/navigation'; // Server-side redirect


export default function TaskStartPage(): JSX.Element { 
  const params = useParams();
  const taskId = params.taskId as string; // Moet overeenkomen met de mapnaam [taskId]

  // Client-side auth check can be added here using useAuth() if needed,
  // but middleware should have already redirected unauthenticated users.
  // TaskExecutionContainer will handle fetching task data and its own loading/error states.

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
