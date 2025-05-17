'use client';
import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import TaskLogsContainer from '@/containers/tasks/TaskLogsContainer'; // Updated import
import TaskLogsLoadingSkeleton from '@/components/tasks/TaskLogsLoadingSkeleton';
import { Task } from '@/types';
import Link from 'next/link';

export default function TaskSpecificLogsPage() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchTask = async () => {
      if (!params.id) return;
      
      try {
        const supabaseClient = getSupabaseBrowserClient();
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }
        
        const { data, error: fetchError } = await supabaseClient
          .from('tasks')
          .select('*')
          .eq('id', params.id)
          .single();
        
        if (fetchError) throw fetchError;
        
        if (!data) {
          throw new Error('Taak niet gevonden');
        }
        
        // Check if user has access to this task
        if (data.user_id !== user.id && data.specialist_id !== user.id) {
          throw new Error('U heeft geen toegang tot deze taak');
        }
        
        setTask(data as Task);
      } catch (error: any) {
        console.error('Fout bij ophalen taak:', error);
        setError(error.message || 'Er is een fout opgetreden bij het ophalen van de taak');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTask();
  }, [params.id, router]);
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error || !task) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-xl font-semibold text-red-600 mb-4">Fout</h1>
          <p className="text-gray-700 mb-6">{error || 'Taak niet gevonden'}</p>
          <Link 
            href="/taken"
            className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
          >
            Terug naar taken
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Logs voor {task.titel}</h1>
        <div className="flex space-x-4">
          <Link 
            href={`/taken/${task.id}`}
            className="text-purple-600 hover:text-purple-800 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Bekijk taak
          </Link>
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
      </div>
      
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Taak Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-700">
                <span className="font-medium">Type:</span> {task.type === 'taak' ? 'Taak' : 'Opdracht'}
              </p>
              {task.duur && (
                <p className="text-gray-700">
                  <span className="font-medium">Geplande duur:</span> {task.duur} minuten
                </p>
              )}
              <p className="text-gray-700">
                <span className="font-medium">Herhaalpatroon:</span> {task.herhaal_patroon}
              </p>
            </div>
            <div>
              {task.beschrijving && (
                <p className="text-gray-700">
                  <span className="font-medium">Beschrijving:</span> {task.beschrijving}
                </p>
              )}
              {task.labels && task.labels.length > 0 && (
                <p className="text-gray-700">
                  <span className="font-medium">Labels:</span> {task.labels.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Suspense fallback={<TaskLogsLoadingSkeleton />}>
        <TaskLogsContainer taskId={task.id} limit={100} title={`Logs voor ${task.titel}`} />
      </Suspense>
      
      <div className="mt-6 flex justify-center">
        <Link 
          href={`/taken/${task.id}/start`}
          className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
        >
          Start deze taak opnieuw
        </Link>
      </div>
    </div>
  );
}
