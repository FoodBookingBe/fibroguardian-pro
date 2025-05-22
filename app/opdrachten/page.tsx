"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import TaskList from '@/components/tasks/TaskList';

export default function OpdrachtenPage(): JSX.Element {
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Function to handle cookie operations
  const handleCookieOperations = async () => {
    // Using cookies API instead of direct manipulation
    document.cookie = "testCookie=value; path=/; max-age=3600";

    // Get all cookies
    const allCookies = document.cookie;
    console.log("All cookies:", allCookies);

    // Delete a cookie
    document.cookie = "testCookie=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  };

  // Fetch tasks data
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }

    return data || [];
  };

  // Use React Query or SWR for data fetching in a real app
  const { data: tasks, isLoading, isError, error } = {
    data: [],
    isLoading: false,
    isError: false,
    error: null
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Opdrachten</h1>

      <div className="mb-6">
        <Link href="/opdrachten/nieuw" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          Nieuwe Opdracht
        </Link>

        <button
          onClick={handleCookieOperations}
          className="ml-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          Test Cookies
        </button>
      </div>

      {isLoading ? (
        <p>Laden...</p>
      ) : isError ? (
        <p>Er is een fout opgetreden: {error?.message}</p>
      ) : tasks.length === 0 ? (
        <p>Geen opdrachten gevonden.</p>
      ) : (
        <TaskList tasks={tasks} />
      )}
    </div>
  );
}