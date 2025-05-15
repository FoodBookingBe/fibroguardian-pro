'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import TaskExecution from '@/components/tasks/TaskExecution';
import { Task } from '@/types';
import Link from 'next/link';

export default function TaskStartPage() {
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
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-1/4 mx-auto"></div>
          </div>
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
      
      <TaskExecution 
        task={task} 
        onComplete={() => router.push('/taken')}
      />
    </div>
  );
}
