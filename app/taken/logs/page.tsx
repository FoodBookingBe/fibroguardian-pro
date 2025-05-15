'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import TaskLogs from '@/components/tasks/TaskLogs';
import Link from 'next/link';

export default function TaskLogsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      const supabaseClient = getSupabaseBrowserClient();
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      setIsAuthenticated(true);
      setIsLoading(false);
    };
    
    checkAuth();
  }, [router]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // Will redirect to login
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Activiteiten Logs</h1>
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
      
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Activiteiten Overzicht</h2>
          <p className="text-gray-700">
            Hier vindt u een overzicht van al uw uitgevoerde taken en opdrachten. 
            Deze logs bevatten informatie over uw pijn- en energieniveaus, vermoeidheid en algemeen gevoel tijdens het uitvoeren van activiteiten.
          </p>
          <p className="text-gray-700 mt-2">
            Deze gegevens helpen u en uw zorgverleners om patronen te identificeren en uw activiteiten beter af te stemmen op uw energieniveau en pijndrempel.
          </p>
        </div>
      </div>
      
      <TaskLogs limit={50} />
    </div>
  );
}
